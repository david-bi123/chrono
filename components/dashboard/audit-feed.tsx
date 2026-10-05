"use client";
import { useEffect, useState, useCallback } from "react";
import {
  UserPlus,
  LogIn,
  QrCode,
  Pencil,
  Settings,
  Ban,
  Building2,
  ScrollText,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import { cn } from "@/lib/utils";

type Log = {
  _id: string;
  action: string;
  targetType?: string;
  targetId?: string;
  actorId?: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
};

const MAP: Record<string, { icon: LucideIcon; tone: string }> = {
  LOGIN: { icon: LogIn, tone: "bg-sky-50 text-sky-600" },
  LOGOUT: { icon: LogIn, tone: "bg-neutral-100 text-neutral-500" },
  STAFF_INVITED: { icon: UserPlus, tone: "bg-brand-50 text-brand-600" },
  STAFF_DISABLED: { icon: Ban, tone: "bg-red-50 text-red-600" },
  STAFF_REACTIVATED: { icon: UserPlus, tone: "bg-emerald-50 text-emerald-600" },
  STAFF_UPDATED: { icon: Pencil, tone: "bg-neutral-100 text-neutral-600" },
  ORGANIZATION_CREATED: { icon: Building2, tone: "bg-brand-50 text-brand-600" },
  ORGANIZATION_STATUS_CHANGED: { icon: Building2, tone: "bg-amber-50 text-amber-600" },
  QR_GENERATED: { icon: QrCode, tone: "bg-violet-50 text-violet-600" },
  QR_REGENERATED: { icon: QrCode, tone: "bg-violet-50 text-violet-600" },
  QR_REVOKED: { icon: QrCode, tone: "bg-red-50 text-red-600" },
  ATTENDANCE_CORRECTED: { icon: Pencil, tone: "bg-amber-50 text-amber-600" },
  SETTINGS_CHANGED: { icon: Settings, tone: "bg-neutral-100 text-neutral-600" },
};

function pretty(action: string) {
  return action.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

export function AuditFeed({
  title = "Audit log",
  description,
}: {
  title?: string;
  description?: string;
}) {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setError("");
    setLoading(true);
    fetch("/api/audit")
      .then(async (r) => {
        if (!r.ok) throw new Error();
        const d = await r.json();
        setLogs(d.logs || []);
      })
      .catch(() => setError("We couldn't load the audit log."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScrollText className="h-4 w-4 text-neutral-500" /> {title}
        </CardTitle>
        <CardDescription>{description ?? "Every sensitive action is recorded with time and IP address."}</CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="No activity recorded yet"
            description="Sign-ins, invitations, QR changes and corrections will appear here."
          />
        ) : (
          <ul className="divide-y divide-neutral-100">
            {logs.map((l) => {
              const conf = MAP[l.action] || { icon: ScrollText, tone: "bg-neutral-100 text-neutral-500" };
              const meta = l.metadata || {};
              const detail =
                typeof meta.name === "string"
                  ? meta.name
                  : typeof meta.email === "string"
                    ? meta.email
                    : typeof meta.reason === "string"
                      ? meta.reason
                      : "";
              return (
                <li key={l._id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                  <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", conf.tone)}>
                    <conf.icon className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-medium text-neutral-900">{pretty(l.action)}</div>
                    {detail && <div className="truncate text-[12.5px] text-neutral-500">{detail}</div>}
                    <div className="mt-0.5 text-[11.5px] text-neutral-500">
                      {l.createdAt ? new Date(l.createdAt).toLocaleString() : ""}
                      {l.ipAddress ? ` · ${l.ipAddress}` : ""}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
