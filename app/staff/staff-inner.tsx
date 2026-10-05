"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatMinutes } from "@/lib/utils";

export default function StaffHome() {
  const [data, setData] = useState<{
    orgName: string; today: { clockIn?: string; clockOut?: string; totalMinutes?: number; status: string } | null;
    stats: { present: number; late: number; totalMinutes: number; attendancePct: number };
  } | null>(null);

  useEffect(() => {
    fetch("/api/staff/overview").then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  if (!data) return <div className="skeleton h-48" />;
  const t = data.today;
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Today&apos;s attendance · {data.orgName}</CardTitle></CardHeader>
        <CardContent>
          {!t ? (
            <div>
              <p className="text-sm text-neutral-500">Not clocked in yet. Scan your organization&apos;s QR code to clock in.</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-4">
              <div><div className="text-xs text-neutral-500">Clock in</div><div className="font-semibold">{t.clockIn ? new Date(t.clockIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</div></div>
              <div><div className="text-xs text-neutral-500">Clock out</div><div className="font-semibold">{t.clockOut ? new Date(t.clockOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</div></div>
              <div><div className="text-xs text-neutral-500">Hours</div><div className="font-semibold">{t.totalMinutes ? formatMinutes(t.totalMinutes) : "—"}</div></div>
              <div><div className="text-xs text-neutral-500">Status</div><Badge value={t.status} /></div>
            </div>
          )}
        </CardContent>
      </Card>
      <div className="grid gap-3 md:grid-cols-3">
        <Card><CardContent className="p-4"><div className="text-2xl font-bold">{data.stats.present}</div><div className="text-xs text-neutral-500">Days present (30d)</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold">{data.stats.late}</div><div className="text-xs text-neutral-500">Late arrivals</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold">{formatMinutes(data.stats.totalMinutes)}</div><div className="text-xs text-neutral-500">Total hours (30d)</div></CardContent></Card>
      </div>
    </div>
  );
}
