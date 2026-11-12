import { NextResponse } from "next/server";
import { z } from "zod";
import mongoose, { Types } from "mongoose";
import { dbConnect } from "@/lib/db/mongoose";
import { User } from "@/models/User";
import { AttendanceLocation } from "@/models/AttendanceLocation";
import { getSession } from "@/lib/auth/session";
import { writeAudit, auditContextFrom } from "@/lib/audit";

const patchSchema = z.object({
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "DISABLED"]).optional(),
  locationId: z.string().regex(/^[a-fA-F0-9]{24}$/).nullable().optional(),
});

async function adminSession() {
  const s = await getSession();
  if (!s || s.role !== "ORGANIZATION_ADMIN" || !s.orgId) return null;
  return s;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const s = await adminSession();
  if (!s) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });

  await dbConnect();
  const manager = await User.findOne({ _id: params.id, organizationId: s.orgId, role: "MANAGER" });
  if (!manager) return NextResponse.json({ error: "Manager not found" }, { status: 404 });

  if (parsed.data.locationId) {
    const location = await AttendanceLocation.findOne({
      _id: parsed.data.locationId,
      organizationId: s.orgId,
      status: "ACTIVE",
    }).lean();
    if (!location) return NextResponse.json({ error: "That branch does not belong to this workspace" }, { status: 400 });
  }

  const { locationId, ...rest } = parsed.data;
  Object.assign(manager, rest);
  if (locationId !== undefined) manager.locationId = locationId ? new Types.ObjectId(locationId) : null;
  await manager.save();

  await writeAudit({
    organizationId: s.orgId,
    actorId: s.sub,
    action: parsed.data.status === "DISABLED" ? "MANAGER_DISABLED" : "MANAGER_UPDATED",
    targetType: "User",
    targetId: params.id,
    metadata: parsed.data,
    ...auditContextFrom(req),
  });

  return NextResponse.json({ ok: true });
}

/**
 * Removes a manager by disabling the account — the person's audit trail and
 * history stay intact, but the seat is released for a replacement.
 */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const s = await adminSession();
  if (!s) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await dbConnect();
  const manager = await User.findOneAndUpdate(
    { _id: params.id, organizationId: s.orgId, role: "MANAGER" },
    { $set: { status: "DISABLED" } },
    { new: true }
  );
  if (!manager) return NextResponse.json({ error: "Manager not found" }, { status: 404 });

  await writeAudit({
    organizationId: s.orgId,
    actorId: s.sub,
    action: "MANAGER_DISABLED",
    targetType: "User",
    targetId: params.id,
    metadata: { email: manager.email },
    ...auditContextFrom(req),
  });
  return NextResponse.json({ ok: true });
}
