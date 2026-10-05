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
  return NextResponse.json({
    orgs: orgs.map((o) => {
      const r = o as Record<string, unknown>;
      return { ...r, _id: String(r._id), staffCount: map.get(String(r._id)) || 0 };
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

  const org = await Organization.create({
    name: parsed.data.name,
    slug: generateSlug(parsed.data.name),
    email: parsed.data.email.toLowerCase().trim(),
    phone: parsed.data.phone || undefined,
    address: parsed.data.address || undefined,
    industry: parsed.data.industry || undefined,
    status: parsed.data.status,
  });

  const admin = await User.create({
    organizationId: org._id,
    role: "ORGANIZATION_ADMIN",
    firstName: parsed.data.adminFirstName,
    lastName: parsed.data.adminLastName,
    email: adminEmail,
    status: "PENDING",
  });

  const raw = generateRawToken();
  await Invitation.create({
    organizationId: org._id,
    email: adminEmail,
    userId: admin._id,
    tokenHash: hashToken(raw),
    type: "ORG_ADMIN",
    expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  await sendOrgAdminInvitation({
    to: adminEmail,
    orgName: org.name,
    adminName: `${admin.firstName} ${admin.lastName}`,
    link: `${appUrl}/accept-invitation?token=${raw}`,
    expiresNote: "This link expires in 72 hours and can only be used once.",
  });

  await writeAudit({
    organizationId: String(org._id),
    actorId: s.sub,
    action: "ORGANIZATION_CREATED",
    targetType: "Organization",
    targetId: String(org._id),
    metadata: { name: org.name, adminEmail },
    ...auditContextFrom(req),
  });

  return NextResponse.json({ ok: true, id: String(org._id) }, { status: 201 });
}
