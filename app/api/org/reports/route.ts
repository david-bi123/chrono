import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/mongoose";
import { Attendance } from "@/models/Attendance";
import { User } from "@/models/User";
import { getSession } from "@/lib/auth/session";

export async function GET(req: Request) {
  const s = await getSession();
  if (!s || s.role !== "ORGANIZATION_ADMIN" || !s.orgId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const url = new URL(req.url);
  const from = url.searchParams.get("from") || "";
  const to = url.searchParams.get("to") || "";
  const format = url.searchParams.get("format") || "json";
  await dbConnect();
  const filter: Record<string, unknown> = { organizationId: s.orgId };
  if (from && to) filter.date = { $gte: from, $lte: to };
  else if (from) filter.date = { $gte: from };
  else if (to) filter.date = { $lte: to };

  const rows = await Attendance.find(filter).populate("staffId", "firstName lastName employeeId department").sort({ date: 1 }).lean();
  const staffList = await User.find({ organizationId: s.orgId, role: "STAFF", status: "ACTIVE" }).select("_id").lean();
  const totalStaff = staffList.length;

  // Summary
  const present = rows.filter((r) => ["PRESENT", "LATE", "EARLY_LEAVE", "HALF_DAY"].includes((r as { status: string }).status)).length;
  const late = rows.filter((r) => (r as { status: string }).status === "LATE").length;
  const early = rows.filter((r) => (r as { status: string }).status === "EARLY_LEAVE").length;
  const totalMinutes = rows.reduce((a, r) => a + ((r as { totalMinutes?: number }).totalMinutes || 0), 0);

  if (format === "csv") {
    const header = "date,employeeId,firstName,lastName,department,clockIn,clockOut,totalMinutes,status";
    const lines = (rows as unknown as Array<Record<string, never>>).map((r) => {
      const st = (r.staffId || {}) as { employeeId?: string; firstName?: string; lastName?: string; department?: string };
      const rec = r as unknown as { date: string; clockIn?: string; clockOut?: string; totalMinutes?: number; status: string };
      return [rec.date, st.employeeId || "", st.firstName || "", st.lastName || "", st.department || "", rec.clockIn || "", rec.clockOut || "", rec.totalMinutes || 0, rec.status].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",");
    });
    const csv = [header, ...lines].join("\n");
    return new NextResponse(csv, {
      headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="chronoswift-report.csv"` },
    });
  }

  return NextResponse.json({
    summary: { records: rows.length, present, late, earlyLeave: early, totalMinutes, totalStaff },
    rows: rows.map((r) => {
      const o = r as unknown as Record<string, unknown>;
      return { ...o, _id: String(o._id) };
    }),
  });
}
