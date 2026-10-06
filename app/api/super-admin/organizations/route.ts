import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db/mongoose";
import { Organization } from "@/models/Organization";
import { User } from "@/models/User";
import { Invitation } from "@/models/Invitation";
import { Attendance } from "@/models/Attendance";
import { getSession } from "@/lib/auth/session";
import { generateRawToken, hashToken, generateSlug } from "@/lib/auth/tokens";
import { createOrgSchema } from "@/lib/validation/schemas";
import { sendOrgAdminInvitation } from "@/lib/email/mailjet";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { writeAudit, auditContextFrom } from "@/lib/audit";

export async function GET(req: Request) {
  const s = await getSession();
  if (!s || s.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const url = new URL(req.url);
  const search = (url.searchParams.get("search") || "").trim();
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const limit = 20;
  await dbConnect();
  const filter: Record<string, unknown> = {};
  if (search) {
    filter.$or = [
      { name: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } },
      { email: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } },
    ];
  }
  const [total, orgs] = await Promise.all([
    Organization.countDocuments(filter),
    Organization.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
  ]);
  // staff counts
  const ids = orgs.map((o) => (o as { _id: unknown })._id);
  const counts = await User.aggregate([
    { $match: { organizationId: { $in: ids }, role: "STAFF" } },
    { $group: { _id: "$organizationId", n: { $sum: 1 } } },
  ]);
  const map = new Map(counts.map((c) => [String(c._id), c.n]));
  // Pending administrators — drives the "resend setup link" action for orgs
  // whose admin never completed setup (e.g. invitation email never arrived).
  const pending = await User.find({
    organizationId: { $in: ids },
    role: "ORGANIZATION_ADMIN",
    status: "PENDING",
  })
    .select("organizationId email")
    .lean();
  const pmap = new Map(
    pending.map((u) => {
      const r = u as unknown as { organizationId: unknown; email: string };
      return [String(r.organizationId), r.email];
    })
  );
  return NextResponse.json({
    orgs: orgs.map((o) => {
      const r = o as Record<string, unknown>;
      return { ...r, _id: String(r._id), staffCount: map.get(String(r._id)) || 0, pendingAdminEmail: pmap.get(String(r._id)) || null };
    }),
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}

export async function POST(req: Request) {
  const s = await getSession();
  if (!s || s.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const rl = rateLimit(rateLimitKey(req, "create-org"), 20, 60 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

  const body = await req.json().catch(() => ({}));
  const parsed = createOrgSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  await dbConnect();
  const adminEmail = parsed.data.adminEmail.toLowerCase().trim();
  const existing = await User.findOne({ email: adminEmail });
  if (existing) return NextResponse.json({ error: "Admin email already in use" }, { status: 409 });

  // The org, its admin and the invitation must all succeed together. If any
  // write fails we remove the partial records so a retry starts clean —
  // previously a crash here (e.g. in the email step) orphaned the org and
  // locked the admin email behind 409s with no way to recover.
  const raw = generateRawToken();
  let orgId: string | null = null;
  let adminId: string | null = null;
  try {
    const org = await Organization.create({
      name: parsed.data.name,
      slug: generateSlug(parsed.data.name),
      email: parsed.data.email.toLowerCase().trim(),
      phone: parsed.data.phone || undefined,
      address: parsed.data.address || undefined,
      industry: parsed.data.industry || undefined,
      status: parsed.data.status,
    });
    orgId = String(org._id);

    const admin = await User.create({
      organizationId: org._id,
      role: "ORGANIZATION_ADMIN",
      firstName: parsed.data.adminFirstName,
      lastName: parsed.data.adminLastName,
      email: adminEmail,
      status: "PENDING",
    });
    adminId = String(admin._id);

    await Invitation.create({
      organizationId: org._id,
      email: adminEmail,
      userId: admin._id,
      tokenHash: hashToken(raw),
      type: "ORG_ADMIN",
      expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
    });
  } catch (e) {
    // Best-effort rollback of this request's partial writes.
    if (adminId) await User.deleteOne({ _id: adminId }).catch(() => {});
    if (orgId) await Organization.deleteOne({ _id: orgId }).catch(() => {});
    const keyValue = (e as { keyValue?: Record<string, unknown> })?.keyValue;
    if ((e as { code?: number })?.code === 11000) {
      if (keyValue && "email" in keyValue) {
        return NextResponse.json({ error: "Admin email already in use" }, { status: 409 });
      }
      return NextResponse.json({ error: "That organization already exists. Please try again." }, { status: 409 });
    }
    console.error("create organization failed", e);
    return NextResponse.json({ error: "Couldn't create the organization. Please try again." }, { status: 500 });
  }

  const appUrl = process.env.APP_URL || "";
  const setupLink = `${appUrl}/accept-invitation?token=${raw}`;

  // Email delivery must never fail the request: the org already exists and the
  // account must remain usable. When delivery fails (or email isn't
  // configured) we hand the one-time setup link back so it can be shared
  // manually instead of stranding the new administrator.
  let emailSent = false;
  try {
    const sent = await sendOrgAdminInvitation({
      to: adminEmail,
      orgName: parsed.data.name,
      adminName: `${parsed.data.adminFirstName} ${parsed.data.adminLastName}`,
      link: setupLink,
      expiresNote: "This link expires in 72 hours and can only be used once.",
    });
    emailSent = !sent.skipped;
  } catch (e) {
    console.error("org admin invitation email failed", e);
    emailSent = false;
  }

  await writeAudit({
    organizationId: String(orgId),
    actorId: s.sub,
    action: "ORGANIZATION_CREATED",
    targetType: "Organization",
    targetId: String(orgId),
    metadata: { name: parsed.data.name, adminEmail, emailSent },
    ...auditContextFrom(req),
  });

  return NextResponse.json(
    { ok: true, id: String(orgId), emailSent, setupLink: emailSent ? undefined : setupLink },
    { status: 201 }
  );
}
