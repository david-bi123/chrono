"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMinutes } from "@/lib/utils";

export default function ReportsPage() {
  const [from, setFrom] = useState(() => new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10));
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [summary, setSummary] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    const r = await fetch(`/api/org/reports?from=${from}&to=${to}`);
    const d = await r.json();
    setSummary(d.summary);
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Report filters</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-auto" />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-auto" />
          <Button variant="secondary" onClick={load} disabled={loading}>{loading ? "Loading…" : "Generate"}</Button>
          <a href={`/api/org/reports?from=${from}&to=${to}&format=csv`} className="rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white">Export CSV</a>
        </CardContent>
      </Card>
      {summary && (
        <div className="grid gap-3 md:grid-cols-3">
          <Card><CardContent className="p-4"><div className="text-2xl font-bold">{summary.records}</div><div className="text-xs text-neutral-500">Records</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-2xl font-bold">{summary.present}</div><div className="text-xs text-neutral-500">Days present</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-2xl font-bold">{summary.late}</div><div className="text-xs text-neutral-500">Late days</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-2xl font-bold">{formatMinutes(summary.totalMinutes)}</div><div className="text-xs text-neutral-500">Total hours</div></CardContent></Card>
        </div>
      )}
      {!summary && <p className="text-sm text-neutral-500">Choose a range and click Generate. CSV is produced server-side.</p>}
    </div>
  );
}
