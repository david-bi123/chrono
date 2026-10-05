"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuditPage() {
  const [logs, setLogs] = useState<Array<Record<string, unknown>>>([]);
  useEffect(() => {
    fetch("/api/audit").then((r) => r.json()).then((d) => setLogs(d.logs || [])).catch(() => {});
  }, []);
  return (
    <Card>
      <CardHeader><CardTitle>Audit logs</CardTitle></CardHeader>
      <CardContent>
        {logs.length === 0 ? <p className="text-sm text-neutral-500">No activity yet.</p> : (
          <div className="space-y-2">
            {logs.map((l) => (
              <div key={String(l._id)} className="rounded-lg border p-3 text-sm">
                <div className="font-medium">{String(l.action).replace(/_/g, " ")}</div>
                <div className="text-xs text-neutral-500">{l.createdAt ? new Date(l.createdAt as string).toLocaleString() : ""} {l.ipAddress ? `· ${l.ipAddress}` : ""}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
