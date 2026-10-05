import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/mongoose";
import { Organization } from "@/models/Organization";
import { User } from "@/models/User";
import { Attendance } from "@/models/Attendance";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const s = await getSession();
  if (!s || s.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await dbConnect();
  const [orgs, staff, admins, todayCount] = await Promise.all([
    Organization.countDocuments(),
    User.countDocuments({ role: "STAFF", status: "ACTIVE" }),
    User.countDocuments({ role: "ORGANIZATION_ADMIN" }),
    Attendance.countDocuments({ date: new Date().toISOString().slice(0, 10) }),
  ]);
  const recentOrgs = await Organization.find().sort({ createdAt: -1 }).limit(5).select("name email status createdAt").lean();
  return NextResponse.json({ orgs, staff, admins, todayCount, recentOrgs });
}
