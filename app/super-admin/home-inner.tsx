"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  ShieldCheck,
  Activity,
  Plus,
  ArrowRight,
  CalendarCheck,
  CreditCard,
  UserCog,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard, StatSkeleton } from "@/components/ui/stat-card";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import { cn } from "@/lib/utils";

type PlanId = "STARTER" | "GROWTH" | "BUSINESS";

type Stats = {
  orgs: number;
  staff: number;
  admins: number;
  managers: number;
  todayCount: number;
  mrr: number;
  renewalsDue: number;
  billingExempt: number;
  plans: Record<PlanId, number>;
  prices: Record<PlanId, number>;
  recentOrgs: Array<{
    _id: string;
    name: string;
    email: string;
    status: string;
    plan?: PlanId;
    subscriptionStatus?: string;
    currentPeriodEnd?: string | null;
    billingExempt?: boolean;
    createdAt?: string;
  }>;
};

const PLAN_TONE: Record<PlanId, string> = {
  STARTER: "bg-neutral-100 text-neutral-700 ring-neutral-200",
  GROWTH: "bg-sky-50 text-sky-700 ring-sky-100",
  BUSINESS: "bg-brand-50 text-brand-700 ring-brand-100",
};

const ghs = (n: number) => `GH₵${n.toLocaleString("en-GH")}`;

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

  const totalPlanOrgs = Math.max(1, stats.orgs);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform overview"
        description="Every workspace, plan and subscription on ChronoSwift."
        actions={
          <LinkButton href="/super-admin/organizations/new">
            <Plus className="h-4 w-4" /> Create organization
          </LinkButton>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Organizations"
          value={stats.orgs}
          icon={Building2}
          tone="brand"
          sub={`${stats.billingExempt} billing-exempt`}
        />
        <StatCard
          label="Monthly recurring"
          value={ghs(stats.mrr)}
          icon={CreditCard}
          tone="success"
          sub="List price, active plans"
        />
        <StatCard
          label="Active staff"
          value={stats.staff}
          icon={Users}
          tone="sky"
          sub={`${stats.managers} managers`}
        />
        <StatCard
          label="Attendance today"
          value={stats.todayCount}
          icon={CalendarCheck}
          tone="violet"
          sub={stats.renewalsDue ? `${stats.renewalsDue} renewals in 7 days` : "Clock events recorded"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 lg:h-fit">
          <CardHeader className="flex-row items-start justify-between gap-3">
            <div>
              <CardTitle>Recent organizations</CardTitle>
              <CardDescription>The latest tenants added to the platform</CardDescription>
            </div>
            <Link
              href="/super-admin/organizations"
              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-[13px] font-semibold text-neutral-700 transition hover:bg-neutral-50"
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
                    <LinkButton href="/super-admin/organizations/new" size="sm">
                      <Plus className="h-4 w-4" /> Create organization
                    </LinkButton>
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
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold text-neutral-900">{o.name}</span>
                          <span
                            className={cn(
                              "shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-semibold ring-1 ring-inset",
                              PLAN_TONE[o.plan || "STARTER"]
                            )}
                          >
                            {(o.plan || "STARTER").charAt(0) + (o.plan || "STARTER").slice(1).toLowerCase()}
                          </span>
                        </div>
                        <div className="truncate text-[12.5px] text-neutral-500">
                          {o.email}
                          {o.currentPeriodEnd
                            ? ` · renews ${new Date(o.currentPeriodEnd).toLocaleDateString()}`
                            : ""}
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
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-neutral-400" /> Plan distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5">
              {(Object.keys(stats.plans) as PlanId[]).map((id) => {
                const count = stats.plans[id];
                const pct = Math.round((count / totalPlanOrgs) * 100);
                return (
                  <div key={id}>
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="font-medium text-neutral-700">
                        {id.charAt(0) + id.slice(1).toLowerCase()}
                        <span className="ml-1.5 text-[11.5px] font-normal text-neutral-400">
                          {ghs(stats.prices[id])}/mo
                        </span>
                      </span>
                      <span className="font-semibold tabular text-neutral-900">{count}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          id === "BUSINESS" ? "bg-brand-600" : id === "GROWTH" ? "bg-sky-500" : "bg-neutral-400"
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <LinkButton href="/super-admin/organizations/new" className="w-full">
                <Plus className="h-4 w-4" /> Create organization
              </LinkButton>
              <LinkButton href="/super-admin/organizations" variant="secondary" className="w-full">
                <Building2 className="h-4 w-4" /> Manage organizations
              </LinkButton>
              <LinkButton href="/super-admin/audit" variant="secondary" className="w-full">
                <Activity className="h-4 w-4" /> Platform activity
              </LinkButton>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-brand-100 bg-brand-50/40">
          <CardHeader>
            <CardTitle className="text-brand-900">How provisioning works</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-brand-800">
              Creating an organization assigns its plan, creates the administrator and emails a single-use setup link
              that expires in 72 hours. Only a hash of the token is stored, and the admin sets their own password.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-4 w-4 text-neutral-400" /> Access model
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm leading-relaxed text-neutral-600">
            <p>
              <span className="font-semibold text-neutral-900">Super admin</span> — creates tenants and owns plans
              and billing.
            </p>
            <p>
              <span className="font-semibold text-neutral-900">Organization admin</span> — runs the workspace,
              invites staff and manages the plan.
            </p>
            <p>
              <span className="font-semibold text-neutral-900">Manager</span> — read-only oversight of attendance,
              staff and reports.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
