"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatMinutes } from "@/lib/utils";

export default function HistoryPage() {
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  useEffect(() => {
    fetch("/api/staff/overview").then((r) => r.json()).then((d) => setRows(d.recent || [])).catch(() => {});
  }, []);
  return (
    <Card>
      <CardHeader><CardTitle>Attendance history</CardTitle></CardHeader>
      <CardContent>
        {rows.length === 0 ? <p className="text-sm text-neutral-500">No records yet.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-neutral-500"><th className="py-2 pr-3">Date</th><th className="pr-3">In</th><th className="pr-3">Out</th><th className="pr-3">Hours</th><th>Status</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={String(r._id)} className="border-t border-neutral-100">
                    <td className="py-2 pr-3">{String(r.date)}</td>
                    <td className="pr-3">{r.clockIn ? new Date(r.clockIn as string).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                    <td className="pr-3">{r.clockOut ? new Date(r.clockOut as string).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                    <td className="pr-3">{(r.totalMinutes as number) ? formatMinutes(r.totalMinutes as number) : "—"}</td>
                    <td><Badge value={String(r.status)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
