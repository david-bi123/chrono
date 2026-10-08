import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/mongoose";
import { Attendance } from "@/models/Attendance";
// Required for .populate("staffId") / .populate("locationId"): route bundles
// only include imported modules, and populate looks the ref'd models up on
// the connection. Without these the endpoint 500s with MissingSchemaError.
import "@/models/User";
import "@/models/AttendanceLocation";
import { getSession } from "@/lib/auth/session";

export async function GET(req: Request) {
  const s = await getSession();
  if (!s || s.role !== "ORGANIZATION_ADMIN" || !s.orgId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const url = new URL(req.url);
  const date = url.searchParams.get("date") || new Date().toISOString().slice(0, 10);
  const status = url.searchParams.get("status") || "";
  const search = (url.searchParams.get("search") || "").trim();
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const limit = 50;
  await dbConnect();
  const filter: Record<string, unknown> = { organizationId: s.orgId };
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) filter.date = date;
  if (status) filter.status = status;
  // Join staff for search: fetch matching staff ids first if needed
  let staffIds: string[] | null = null;
  if (search) {
    const { User } = await import("@/models/User");
    const rx = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    const users = await User.find({ organizationId: s.orgId, $or: [{ firstName: rx }, { lastName: rx }, { employeeId: rx }] }).select("_id").lean();
    staffIds = users.map((u) => String((u as { _id: unknown })._id));
    filter.staffId = { $in: staffIds };
  }
  const [total, rows] = await Promise.all([
    Attendance.countDocuments(filter),
    Attendance.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate("staffId", "firstName lastName employeeId department").populate("locationId", "name").lean(),
  ]);
  return NextResponse.json({
    rows: rows.map((r) => {
      const o = r as unknown as Record<string, unknown>;
      return { ...o, _id: String(o._id) };
    }),
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}
