import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/mongoose";
import { User } from "@/models/User";
import { Invitation } from "@/models/Invitation";
import { AttendanceLocation } from "@/models/AttendanceLocation";
import { Organization } from "@/models/Organization";
import { getSession } from "@/lib/auth/session";
import { generateRawToken, hashToken } from "@/lib/auth/tokens";
import { inviteManagerSchema } from "@/lib/validation/schemas";
import { sendManagerInvitation } from "@/lib/email/mailjet";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { writeAudit, auditContextFrom } from "@/lib/audit";
import { assertActiveSubscription, assertCanAdd, getEntitlements, planErrorPayload } from "@/lib/subscriptions/entitlements";

async function orgSession() {
  const s = await getSession();
  if (!s || !s.orgId || !["ORGANIZATION_ADMIN", "MANAGER"].includes(s.role)) return null;
  return s;
}

/** Manager roster. Admins and managers may read it; only admins may change it. */
export async function GET(req: Request) {
  const s = await orgSession();
  if (!s) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const url = new URL(req.url);
  const search = (url.searchParams.get("search") || "").trim();
  await dbConnect();

  const filter: Record<string, unknown> = { organizationId: s.orgId, role: "MANAGER" };
  if (search) {
    const rx = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    filter.$or = [{ firstName: rx }, { lastName: rx }, { email: rx }];
  }
  const managers = await User.find(filter)
    .select("firstName lastName email phone status locationId createdAt")
    .populate("locationId", "name")
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  return NextResponse.json({
    managers: managers.map((m) => {
      const r = m as unknown as Record<string, unknown>;
      const loc = r.locationId as { _id?: unknown; name?: string } | null;
      return {
        ...r,
        _id: String(r._id),
        locationId: loc && loc._id ? String(loc._id) : null,
        locationName: loc?.name ?? null,
      };
    }),
  });
}

export async function POST(req: Request) {
  const s = await getSession();
  if (!s || s.role !== "ORGANIZATION_ADMIN" || !s.orgId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const rl = rateLimit(rateLimitKey(req, `invite-manager:${s.orgId}`), 20, 60 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Too many invitations. Try again later." }, { status: 429 });

  const body = await req.json().catch(() => ({}));
  const parsed = inviteManagerSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  await dbConnect();

  const org = await Organization.findById(s.orgId);
  if (!org || org.status !== "ACTIVE") return NextResponse.json({ error: "Organization suspended" }, { status: 403 });

  try {
    const entitlements = await getEntitlements(String(s.orgId));
    if (!entitlements) return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    assertActiveSubscription(entitlements);
    assertCanAdd(entitlements, "managers");
  } catch (e) {
    const planError = planErrorPayload(e);
    if (planError) return NextResponse.json(planError.body, { status: planError.status });
    throw e;
  }

  const email = parsed.data.email.toLowerCase().trim();
  if (await User.findOne({ email })) return NextResponse.json({ error: "Email already in use" }, { status: 409 });

  let location = null;
  if (parsed.data.locationId) {
    location = await AttendanceLocation.findOne({
      _id: parsed.data.locationId,
      organizationId: s.orgId,
      status: "ACTIVE",
    }).lean();
    if (!location) return NextResponse.json({ error: "That branch does not belong to this workspace" }, { status: 400 });
  }

  const raw = generateRawToken();
  let managerId: string | null = null;
  try {
    const manager = await User.create({
      organizationId: s.orgId,
      role: "MANAGER",
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      email,
      phone: parsed.data.phone || undefined,
      locationId: parsed.data.locationId || null,
      status: "PENDING",
    });
    managerId = String(manager._id);
    await Invitation.create({
      organizationId: s.orgId,
      email,
      userId: manager._id,
      tokenHash: hashToken(raw),
      type: "MANAGER",
      expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
    });
  } catch (e) {
    if (managerId) await User.deleteOne({ _id: managerId }).catch(() => {});
    if ((e as { code?: number })?.code === 11000) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }
    console.error("invite manager failed", e);
    return NextResponse.json({ error: "Couldn't send the invitation. Please try again." }, { status: 500 });
  }

  const appUrl = process.env.APP_URL || "";
  const setupLink = `${appUrl}/accept-invitation?token=${raw}`;
  let emailSent = false;
  try {
    const sent = await sendManagerInvitation({
      to: email,
      orgName: org.name,
      managerName: `${parsed.data.firstName} ${parsed.data.lastName}`,
      branchName: (location as { name?: string } | null)?.name,
      link: setupLink,
      expiresNote: "This invitation expires in 72 hours and can only be used once.",
    });
    emailSent = !sent.skipped;
  } catch (e) {
    console.error("manager invitation email failed", e);
  }

  await writeAudit({
    organizationId: s.orgId,
    actorId: s.sub,
    action: "MANAGER_INVITED",
    targetType: "User",
    targetId: String(managerId),
    metadata: { email, locationId: parsed.data.locationId || null, emailSent },
    ...auditContextFrom(req),
  });

  return NextResponse.json(
    { ok: true, id: String(managerId), emailSent, setupLink: emailSent ? undefined : setupLink },
    { status: 201 }
  );
}
