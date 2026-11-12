"use client";
import { useCallback, useEffect, useState } from "react";
import {
  CalendarClock,
  Check,
  CreditCard,
  History,
  Infinity as InfinityIcon,
  Receipt,
  ShieldCheck,
  Sparkles,
  Users,
  Building2,
  UserCog,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader, SectionHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type Limits = { staff: number | null; managers: number | null; branches: number | null; historyMonths: number | null };
type Usage = { staff: number; managers: number; branches: number };
type Plan = {
  id: string;
  name: string;
  priceGhs: number;
  tagline: string;
  description: string;
  limits: Limits;
  highlights: string[];
};

type Subscription = {
  plan: Plan;
  status: string;
  planStartedAt: string | null;
  currentPeriodEnd: string | null;
  billingExempt: boolean;
  usage: Usage;
  limits: Limits;
  remaining: { staff: number | null; managers: number | null; branches: number | null };
  historyMonths: number | null;
  oldestHistoryDate: string | null;
  upgradeTo: string | null;
};

type Payment = {
  _id: string;
  reference: string;
  plan: string;
  amountGhs: number;
  status: string;
  paidAt?: string | null;
  createdAt: string;
  channel?: string | null;
};

type Event = {
  _id: string;
  type: string;
  fromPlan?: string | null;
  toPlan?: string | null;
  fromStatus?: string | null;
  toStatus?: string | null;
  note?: string | null;
  createdAt: string;
};

const ghs = (n: number) => `GH₵${n.toLocaleString("en-GH")}`;

function dateLabel(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_TONE: Record<string, string> = {
  ACTIVE: "bg-brand-50 text-brand-700 ring-brand-100",
  PAST_DUE: "bg-amber-50 text-amber-700 ring-amber-100",
  SUSPENDED: "bg-red-50 text-red-700 ring-red-100",
  CANCELLED: "bg-neutral-100 text-neutral-600 ring-neutral-200",
  PENDING: "bg-sky-50 text-sky-700 ring-sky-100",
  SUCCESS: "bg-brand-50 text-brand-700 ring-brand-100",
  FAILED: "bg-red-50 text-red-700 ring-red-100",
  ABANDONED: "bg-neutral-100 text-neutral-600 ring-neutral-200",
};

function Pill({ value }: { value: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-semibold capitalize ring-1 ring-inset",
        STATUS_TONE[value] || "bg-neutral-100 text-neutral-600 ring-neutral-200"
      )}
    >
      {value.replace(/_/g, " ").toLowerCase()}
    </span>
  );
}

function Meter({
  icon: Icon,
  label,
  used,
  limit,
  unit = "",
}: {
  icon: typeof Users;
  label: string;
  used: number;
  limit: number | null;
  unit?: string;
}) {
  const unlimited = limit === null;
  const pct = unlimited ? 0 : Math.min(100, limit ? (used / limit) * 100 : 0);
  const near = !unlimited && pct >= 80;
  return (
    <div className="rounded-xl border border-neutral-200/80 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-[13px] font-medium text-neutral-600">
          <Icon className="h-4 w-4 shrink-0 text-neutral-400" />
          <span className="truncate">{label}</span>
        </div>
        <div className="shrink-0 text-[13px] font-semibold tabular text-neutral-900">
          {used}
          <span className="font-normal text-neutral-400">
            {unlimited ? " / unlimited" : ` / ${limit}`}
          </span>
          {unit && <span className="ml-1 font-normal text-neutral-400">{unit}</span>}
        </div>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-500",
            near ? "bg-amber-500" : "bg-brand-600"
          )}
          style={{ width: `${unlimited ? 100 : pct}%` }}
        />
      </div>
      {near && (
        <p className="mt-2 text-[12px] font-medium text-amber-700">
          Close to your limit — upgrade to add more.
        </p>
      )}
    </div>
  );
}

export default function SubscriptionPage({ canManage }: { canManage: boolean }) {
  const [data, setData] = useState<{
    subscription: Subscription;
    plans: Plan[];
    payments: Payment[];
    events: Event[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyPlan, setBusyPlan] = useState<string | null>(null);
  const { toast } = useToast();

  const load = useCallback(async () => {
    try {
      setError("");
      const res = await fetch("/api/org/subscription");
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Couldn't load your subscription");
      setData(body);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load your subscription");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function startCheckout(planId: string) {
    setBusyPlan(planId);
    try {
      const res = await fetch("/api/org/subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Payment could not be started");
      if (body.authorizationUrl) {
        window.location.href = body.authorizationUrl;
        return;
      }
      throw new Error("Payment could not be started");
    } catch (e) {
      toast({
        title: "Payment could not be started",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "error",
      });
      setBusyPlan(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="skeleton h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-24 rounded-xl" />
          ))}
        </div>
        <div className="skeleton h-64 rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState message={error || "Something went wrong"} onRetry={load} />;
  }

  const { subscription, plans, payments, events } = data;
  const currentRank = plans.findIndex((p) => p.id === subscription.plan.id);
  const upgradePlans = plans.filter((_, i) => i > currentRank);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscription & billing"
        description="Your plan, what you're using, and every payment made for this workspace."
      />

      {subscription.status !== "ACTIVE" && (
        <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p>
            <span className="font-semibold">This subscription is {subscription.status.toLowerCase().replace(/_/g, " ")}.</span>{" "}
            Attendance records are safe, but new invitations and clock-ins are paused until it is restored. Contact SamTech Labs.
          </p>
        </div>
      )}

      {subscription.billingExempt && (
        <div className="flex gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3.5 text-sm text-sky-900">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
          <p>
            <span className="font-semibold">Billing-exempt workspace.</span> This organisation is managed by SamTech Labs
            and is not charged. Card checkout is disabled for it.
          </p>
        </div>
      )}

      {/* Current plan */}
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-5 border-b border-neutral-100 bg-[linear-gradient(135deg,rgba(16,92,70,0.06),rgba(16,92,70,0.01))] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="font-display text-xl font-bold tracking-[-0.02em] text-neutral-900">
                {subscription.plan.name} plan
              </h2>
              <Pill value={subscription.status} />
              {subscription.plan.id === "BUSINESS" && (
                <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-brand-600 px-2.5 py-1 text-[11.5px] font-semibold text-white">
                  <Sparkles className="h-3 w-3" /> Top tier
                </span>
              )}
            </div>
            <p className="mt-1.5 max-w-xl text-[14px] leading-relaxed text-neutral-600">
              {subscription.plan.tagline}
            </p>
          </div>
          <div className="shrink-0 text-left sm:text-right">
            <div className="text-[28px] font-semibold leading-none tracking-[-0.03em] tabular text-neutral-900">
              {ghs(subscription.plan.priceGhs)}
              <span className="ml-1 text-[13px] font-normal text-neutral-500">/month</span>
            </div>
            <div className="mt-1.5 text-[13px] text-neutral-500">
              {subscription.currentPeriodEnd
                ? `Renews ${dateLabel(subscription.currentPeriodEnd)}`
                : "No renewal scheduled"}
            </div>
          </div>
        </div>

        <CardContent className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-4">
          <Meter icon={Users} label="Staff" used={subscription.usage.staff} limit={subscription.limits.staff} />
          <Meter icon={UserCog} label="Managers" used={subscription.usage.managers} limit={subscription.limits.managers} />
          <Meter icon={Building2} label="Branches" used={subscription.usage.branches} limit={subscription.limits.branches} />
          <div className="rounded-xl border border-neutral-200/80 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2 text-[13px] font-medium text-neutral-600">
                <History className="h-4 w-4 shrink-0 text-neutral-400" />
                <span className="truncate">History</span>
              </div>
              <div className="shrink-0 text-[13px] font-semibold tabular text-neutral-900">
                {subscription.historyMonths === null ? (
                  <span className="inline-flex items-center gap-1">
                    <InfinityIcon className="h-4 w-4" /> unlimited
                  </span>
                ) : (
                  `${subscription.historyMonths} months`
                )}
              </div>
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
              <div className="h-full w-full rounded-full bg-brand-600" />
            </div>
            <p className="mt-2 text-[12px] text-neutral-500">
              {subscription.oldestHistoryDate
                ? `Records from ${dateLabel(subscription.oldestHistoryDate)} onwards`
                : "All records are accessible"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade options */}
      <Card>
        <CardHeader>
          <SectionHeader
            title="Change plan"
            description={
              upgradePlans.length
                ? "Upgrades apply immediately. Payment is processed by Paystack and confirmed on the server before your plan changes."
                : "You're on the highest plan — every capability is unlocked."
            }
          />
        </CardHeader>
        <CardContent>
          {upgradePlans.length === 0 ? (
            <div className="flex items-center gap-3 rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-4 text-sm text-brand-900">
              <Check className="h-5 w-5 shrink-0 text-brand-600" />
              <p>
                <span className="font-semibold">Business is unlocked.</span> Unlimited staff, branches, managers and
                attendance history — plus organisation-wide analytics and audit logs.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {upgradePlans.map((plan) => (
                <div
                  key={plan.id}
                  className={cn(
                    "flex flex-col rounded-xl border border-neutral-200/80 bg-white p-5 transition-colors",
                    "hover:border-brand-200"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-[15px] font-semibold tracking-[-0.01em] text-neutral-900">
                        {plan.name}
                      </h3>
                      <p className="mt-1 text-[13px] text-neutral-500">{plan.tagline}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-[19px] font-semibold tracking-[-0.02em] tabular text-neutral-900">
                        {ghs(plan.priceGhs)}
                      </div>
                      <div className="text-[12px] text-neutral-500">per month</div>
                    </div>
                  </div>

                  <ul className="mt-4 flex-1 space-y-2">
                    {plan.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-2 text-[13px] text-neutral-600">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-5">
                    {canManage && !subscription.billingExempt ? (
                      <Button
                        onClick={() => startCheckout(plan.id)}
                        loading={busyPlan === plan.id}
                        className="w-full"
                      >
                        <CreditCard className="h-4 w-4" /> Upgrade to {plan.name}
                      </Button>
                    ) : (
                      <div className="rounded-lg bg-neutral-50 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-neutral-600 ring-1 ring-inset ring-neutral-100">
                        {subscription.billingExempt
                          ? "Billing-exempt workspace — contact SamTech Labs to change plans."
                          : "Only the organisation administrator can change the plan."}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payments + history */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[15px]">
              <Receipt className="h-4 w-4 text-neutral-400" /> Payment history
            </CardTitle>
            <CardDescription>Every checkout attempt on this workspace, newest first.</CardDescription>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <p className="rounded-lg bg-neutral-50 px-3.5 py-3 text-[13px] text-neutral-500">
                No payments yet. {subscription.billingExempt ? "This workspace is billing-exempt." : "Upgrades are billed monthly through Paystack."}
              </p>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {payments.map((p) => (
                  <li key={p._id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <div className="truncate text-[13.5px] font-medium text-neutral-900">
                        {p.plan.charAt(0) + p.plan.slice(1).toLowerCase()} plan
                      </div>
                      <div className="truncate font-mono text-[11.5px] text-neutral-400">{p.reference}</div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-[13.5px] font-semibold tabular text-neutral-900">{ghs(p.amountGhs)}</span>
                      <Pill value={p.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[15px]">
              <TrendingUp className="h-4 w-4 text-neutral-400" /> Plan history
            </CardTitle>
            <CardDescription>Plan changes, status updates and payment confirmations.</CardDescription>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className="rounded-lg bg-neutral-50 px-3.5 py-3 text-[13px] text-neutral-500">
                No subscription changes recorded yet.
              </p>
            ) : (
              <ol className="space-y-3">
                {events.map((e) => {
                  const planName = (id?: string | null) =>
                    id ? id.charAt(0) + id.slice(1).toLowerCase() : null;
                  const humanStatus = (value?: string | null) =>
                    value ? value.toLowerCase().replace(/_/g, " ") : null;
                  const summary =
                    e.type === "STATUS_CHANGED"
                      ? humanStatus(e.fromStatus) &&
                        humanStatus(e.toStatus) &&
                        e.fromStatus !== e.toStatus
                        ? `${humanStatus(e.fromStatus)} → ${humanStatus(e.toStatus)}`
                        : null
                      : planName(e.toPlan)
                        ? `— ${planName(e.toPlan)}`
                        : null;
                  return (
                    <li key={e._id} className="flex gap-3">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                      <div className="min-w-0">
                        <div className="text-[13.5px] font-medium text-neutral-900">
                          {e.type.replace(/_/g, " ").toLowerCase().replace(/^./, (c) => c.toUpperCase())}
                          {summary && <span className="font-normal text-neutral-600"> {summary}</span>}
                        </div>
                        <div className="text-[12px] text-neutral-500">
                          {dateLabel(e.createdAt)}
                          {e.note ? ` · ${e.note}` : ""}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-neutral-200/80 bg-white px-4 py-3.5 text-[13px] leading-relaxed text-neutral-600">
        <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
        <p>
          Plan changes, activations and extensions are recorded by SamTech Labs and shown above. Downgrading never deletes
          attendance records — it only limits how far back your workspace can read.
        </p>
      </div>
    </div>
  );
}
