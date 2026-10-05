"use client";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AttendancePage() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    const r = await fetch(`/api/org/attendance?date=${date}&status=${status}&search=${encodeURIComponent(search)}`);
    const d = await r.json();
    setRows(d.rows || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap gap-2 p-4">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-auto" />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-lg border px-3 text-sm">
            <option value="">All statuses</option>
            <option value="PRESENT">Present</option>
            <option value="LATE">Late</option>
            <option value="EARLY_LEAVE">Early leave</option>
            <option value="HALF_DAY">Half day</option>
            <option value="INCOMPLETE">Incomplete</option>
          </select>
          <Input placeholder="Search staff…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-48" />
          <Button variant="secondary" onClick={load}>Filter</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Records · {date}</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="skeleton h-40" /> : rows.length === 0 ? <p className="text-sm text-neutral-500">No records for this filter.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs text-neutral-500"><th className="py-2 pr-3">Staff</th><th className="pr-3">In</th><th className="pr-3">Out</th><th className="pr-3">Mins</th><th>Status</th></tr></thead>
                <tbody>
                  {rows.map((r) => {
                    const st = (r.staffId || {}) as { firstName?: string; lastName?: string; employeeId?: string };
                    return (
                      <tr key={String(r._id)} className="border-t border-neutral-100">
                        <td className="py-2 pr-3">{st.firstName} {st.lastName}</td>
                        <td className="pr-3">{r.clockIn ? new Date(r.clockIn as string).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                        <td className="pr-3">{r.clockOut ? new Date(r.clockOut as string).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                        <td className="pr-3">{(r.totalMinutes as number) || "—"}</td>
                        <td><Badge value={String(r.status)} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
