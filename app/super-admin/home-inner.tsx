"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Users, ShieldCheck, Activity, Plus, ArrowRight, CalendarCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard, StatSkeleton } from "@/components/ui/stat-card";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";

type Stats = {
  orgs: number;
  staff: number;
  admins: number;
  todayCount: number;
  recentOrgs: Array<{ _id: string; name: string; email: string; status: string; createdAt?: string }>;
};

export default function SuperAdminHome() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);

  const load = useCallback(() => {
    setError("");
    fetch("/api/super-admin/stats")
      .then(async (r) => {
        if (!r.ok) throw new Error();
        setStats(await r.json());
      })
      .catch(() => setError("We couldn't load platform statistics."));
  }, []);

  useEffect(() => {
    load();
  }, [load, tick]);

  if (error) return <ErrorState message={error} onRetry={() => setTick((t) => t + 1)} />;

  if (!stats) {
    return (
      <div className="space-y-5">
        <div className="space-y-2.5">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <StatSkeleton key={i} />
          ))}
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform overview"
        description="Everything provisioned on Chrono, at a glance."
        actions={
          <Link href="/super-admin/organizations/new">
            <Button>
              <Plus className="h-4 w-4" /> Create organization
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Organizations" value={stats.orgs} icon={Building2} tone="brand" sub="Tenants on the platform" />
        <StatCard label="Active staff" value={stats.staff} icon={Users} tone="success" sub="Enabled accounts" />
        <StatCard label="Org admins" value={stats.admins} icon={ShieldCheck} tone="neutral" sub="Workspace owners" />
        <StatCard
          label="Attendance today"
          value={stats.todayCount}
          icon={CalendarCheck}
          tone="sky"
          sub="Clock events recorded"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-start justify-between gap-3">
            <div>
              <CardTitle>Recent organizations</CardTitle>
              <CardDescription>The latest tenants added to the platform</CardDescription>
            </div>
            <Link
              href="/super-admin/organizations"
              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-[12.5px] font-semibold text-neutral-700 transition hover:bg-neutral-50"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="px-0 pb-0 pt-2 sm:px-0">
            {stats.recentOrgs.length === 0 ? (
              <div className="px-5 pb-5">
                <EmptyState
                  icon={Building2}
                  title="No organizations yet"
                  description="Create your first tenant to start onboarding administrators."
                  action={
                    <Link href="/super-admin/organizations/new">
                      <Button size="sm">
                        <Plus className="h-4 w-4" /> Create organization
                      </Button>
                    </Link>
                  }
                />
              </div>
            ) : (
              <ul className="divide-y divide-neutral-100 px-5 sm:px-6">
                {stats.recentOrgs.map((o) => (
                  <li key={o._id} className="flex items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                        <Building2 className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-[13.5px] font-semibold text-neutral-900">{o.name}</div>
                        <div className="truncate text-[12px] text-neutral-500">
                          {o.email}
                          {o.createdAt ? ` · created ${new Date(o.createdAt).toLocaleDateString()}` : ""}
                        </div>
                      </div>
                    </div>
                    <StatusBadge value={o.status} size="sm" />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Link href="/super-admin/organizations/new">
                <Button className="w-full">
                  <Plus className="h-4 w-4" /> Create organization
                </Button>
              </Link>
              <Link href="/super-admin/organizations">
                <Button variant="secondary" className="w-full">
                  <Building2 className="h-4 w-4" /> Manage organizations
                </Button>
              </Link>
              <Link href="/super-admin/audit">
                <Button variant="secondary" className="w-full">
                  <Activity className="h-4 w-4" /> Platform activity
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-brand-100 bg-brand-50/40">
            <CardHeader>
              <CardTitle className="text-brand-900">How provisioning works</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[13px] leading-relaxed text-brand-800">
                Creating an organization also creates its administrator and emails a single-use setup link that expires
                in 72 hours. Only a hash of the token is stored, and the admin sets their own password — it&apos;s never
                sent by email.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
