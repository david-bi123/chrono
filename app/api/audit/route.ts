import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/mongoose";
import { AuditLog } from "@/models/AuditLog";
import { getSession } from "@/lib/auth/session";

export async function GET(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await dbConnect();
  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const limit = 50;
  const filter: Record<string, unknown> = {};
  if (s.role === "SUPER_ADMIN") {
    // platform-wide, optional org filter
    const orgId = url.searchParams.get("orgId");
    if (orgId) filter.organizationId = orgId;
  } else {
    if (!s.orgId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    filter.organizationId = s.orgId;
  }
  const [total, logs] = await Promise.all([
    AuditLog.countDocuments(filter),
    AuditLog.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
  ]);
  return NextResponse.json({
    logs: logs.map((l) => {
      const o = l as unknown as Record<string, unknown>;
      return { ...o, _id: String(o._id) };
    }),
    total,
    page,
  });
}
