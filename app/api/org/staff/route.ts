import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/mongoose";
import { User } from "@/models/User";
import { Invitation } from "@/models/Invitation";
import { getSession } from "@/lib/auth/session";
import { generateRawToken, hashToken } from "@/lib/auth/tokens";
import { inviteStaffSchema } from "@/lib/validation/schemas";
import { sendStaffInvitation } from "@/lib/email/mailjet";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { writeAudit, auditContextFrom } from "@/lib/audit";
import { Organization } from "@/models/Organization";

async function orgSession() {
  const s = await getSession();
  if (!s || s.role !== "ORGANIZATION_ADMIN" || !s.orgId) return null;
  return s;
}

export async function GET(req: Request) {
  const s = await orgSession();
  if (!s) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const url = new URL(req.url);
  const search = (url.searchParams.get("search") || "").trim();
  const dept = url.searchParams.get("department") || "";
  const status = url.searchParams.get("status") || "";
  await dbConnect();
  const filter: Record<string, unknown> = { organizationId: s.orgId, role: "STAFF" };
  if (dept) filter.department = dept;
  if (status) filter.status = status;
  if (search) {
    const rx = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    filter.$or = [{ firstName: rx }, { lastName: rx }, { email: rx }, { employeeId: rx }];
  }
  const staff = await User.find(filter).sort({ createdAt: -1 }).limit(200).lean();
  const depts = await User.distinct("department", { organizationId: s.orgId, role: "STAFF" });
  return NextResponse.json({
    staff: staff.map((u) => {
      const r = u as unknown as Record<string, unknown>;
      return { ...r, _id: String(r._id), passwordHash: undefined };
    }),
    departments: (depts as unknown[]).filter(Boolean),
  });
}

export async function POST(req: Request) {
  const s = await orgSession();
  if (!s) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const rl = rateLimit(rateLimitKey(req, `invite:${s.orgId}`), 30, 60 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Too many invitations. Try again later." }, { status: 429 });
  const body = await req.json().catch(() => ({}));
  const parsed = inviteStaffSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  await dbConnect();
  const org = await Organization.findById(s.orgId);
  if (!org || org.status !== "ACTIVE") return NextResponse.json({ error: "Organization suspended" }, { status: 403 });
  const email = parsed.data.email.toLowerCase().trim();
  if (await User.findOne({ email })) return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  if (await User.findOne({ organizationId: s.orgId, employeeId: parsed.data.employeeId })) {
    return NextResponse.json({ error: "Employee ID already in use" }, { status: 409 });
  }
  const staff = await User.create({
    organizationId: s.orgId,
    role: "STAFF",
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName,
    email,
    employeeId: parsed.data.employeeId,
    department: parsed.data.department || undefined,
    position: parsed.data.position || undefined,
    phone: parsed.data.phone || undefined,
    status: "PENDING",
  });
  const raw = generateRawToken();
  await Invitation.create({
    organizationId: s.orgId,
    email,
    userId: staff._id,
    tokenHash: hashToken(raw),
    type: "STAFF",
    expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
  });
  const appUrl = process.env.APP_URL || "";
  await sendStaffInvitation({
    to: email,
    orgName: org.name,
    staffName: `${staff.firstName} ${staff.lastName}`,
    link: `${appUrl}/accept-invitation?token=${raw}`,
    expiresNote: "This invitation expires in 72 hours and can only be used once.",
  });
  await writeAudit({
    organizationId: s.orgId,
    actorId: s.sub,
    action: "STAFF_INVITED",
    targetType: "User",
    targetId: String(staff._id),
    metadata: { email },
    ...auditContextFrom(req),
  });
  return NextResponse.json({ ok: true, id: String(staff._id) }, { status: 201 });
}
