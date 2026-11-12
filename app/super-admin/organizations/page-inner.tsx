"use client";
import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Building2,
  Ban,
  RotateCcw,
  SearchX,
  Mail,
  CreditCard,
  CalendarClock,
  ShieldCheck,
  History,
} from "lucide-react";
import { Button, LinkButton } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { PageHeader, FilterBar, SearchInput } from "@/components/ui/page-header";
import { DataTable, TablePagination, type Column } from "@/components/ui/data-table";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { ConfirmDialog, Modal } from "@/components/ui/dialog";
import { SetupLinkPanel } from "@/components/ui/spam-notice";
import { useToast } from "@/components/ui/toast";
import { Field, Input, Select, Textarea, FormAlert } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PlanId = "STARTER" | "GROWTH" | "BUSINESS";

interface Org {
  _id: string;
  name: string;
  email: string;
  status: string;
  plan?: PlanId;
  subscriptionStatus?: string;
  planStartedAt?: string | null;
  currentPeriodEnd?: string | null;
  billingExempt?: boolean;
  staffCount: number;
  managerCount?: number;
  branchCount?: number;
  pendingAdminEmail: string | null;
  createdAt?: string;
}

interface PlanMeta {
  id: PlanId;
  name: string;
  priceGhs: number;
  limits: { staff: number | null; managers: number | null; branches: number | null; historyMonths: number | null };
}

interface OrgDetail {
  organization: Record<string, unknown> & { name: string; plan?: PlanId };
  subscription: {
    plan: PlanMeta;
    status: string;
    usage: { staff: number; managers: number; branches: number };
    limits: PlanMeta["limits"];
    historyMonths: number | null;
  } | null;
  events: Array<{
    _id: string;
    type: string;
    fromPlan?: string | null;
    toPlan?: string | null;
    fromStatus?: string | null;
    toStatus?: string | null;
    note?: string | null;
    createdAt: string;
  }>;
}

const PLAN_META: Record<PlanId, PlanMeta> = {
  STARTER: {
    id: "STARTER",
    name: "Starter",
    priceGhs: 500,
    limits: { staff: 30, managers: 2, branches: 1, historyMonths: 6 },
  },
  GROWTH: {
    id: "GROWTH",
    name: "Growth",
    priceGhs: 750,
    limits: { staff: 70, managers: 5, branches: 3, historyMonths: 12 },
  },
  BUSINESS: {
    id: "BUSINESS",
    name: "Business",
    priceGhs: 1000,
    limits: { staff: null, managers: null, branches: null, historyMonths: null },
  },
};

const PLAN_TONE: Record<PlanId, string> = {
  STARTER: "bg-neutral-100 text-neutral-700 ring-neutral-200",
  GROWTH: "bg-sky-50 text-sky-700 ring-sky-100",
  BUSINESS: "bg-brand-50 text-brand-700 ring-brand-100",
};

const SUB_TONE: Record<string, string> = {
  ACTIVE: "bg-brand-50 text-brand-700 ring-brand-100",
  PAST_DUE: "bg-amber-50 text-amber-700 ring-amber-100",
  SUSPENDED: "bg-red-50 text-red-700 ring-red-100",
  CANCELLED: "bg-neutral-100 text-neutral-600 ring-neutral-200",
};

const ghs = (n: number) => `GH₵${n.toLocaleString("en-GH")}`;
const limitLabel = (n: number | null) => (n === null ? "Unlimited" : String(n));

function dateLabel(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function PlanBadge({ plan }: { plan?: PlanId }) {
  const id = plan || "STARTER";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11.5px] font-semibold ring-1 ring-inset",
        PLAN_TONE[id]
      )}
    >
      {PLAN_META[id].name}
    </span>
  );
}

export default function OrgsPage() {
  const { toast } = useToast();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [confirm, setConfirm] = useState<{ open: boolean; org?: Org; next: "ACTIVE" | "SUSPENDED" }>({
    open: false,
    next: "SUSPENDED",
  });
  const [busy, setBusy] = useState(false);

  // Fresh setup link for an org whose admin never completed onboarding.
  const [resend, setResend] = useState<{ open: boolean; org?: Org }>({ open: false });
  const [resendBusy, setResendBusy] = useState(false);
  const [resendResult, setResendResult] = useState<{ email: string; link: string } | null>(null);

  // Plan management
  const [planModal, setPlanModal] = useState<{ open: boolean; org?: Org }>({ open: false });
  const [detail, setDetail] = useState<OrgDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [planForm, setPlanForm] = useState({
    plan: "STARTER" as PlanId,
    subscriptionStatus: "ACTIVE",
    extendDays: "",
    billingExempt: false,
    note: "",
  });
  const [planError, setPlanError] = useState("");
  const [planBusy, setPlanBusy] = useState(false);

  async function openPlanModal(org: Org) {
    setPlanModal({ open: true, org });
    setPlanError("");
    setDetail(null);
    setDetailLoading(true);
    setPlanForm({
      plan: org.plan || "STARTER",
      subscriptionStatus: org.subscriptionStatus || "ACTIVE",
      extendDays: "",
      billingExempt: Boolean(org.billingExempt),
      note: "",
    });
    try {
      const r = await fetch(`/api/super-admin/organizations/${org._id}`);
      const d = await r.json().catch(() => ({}));
      if (r.ok) setDetail(d as OrgDetail);
    } catch {
      /* the modal still works with list data */
    } finally {
      setDetailLoading(false);
    }
  }

  async function savePlan() {
    if (!planModal.org) return;
    setPlanError("");
    setPlanBusy(true);
    try {
      const payload: Record<string, unknown> = {
        plan: planForm.plan,
        subscriptionStatus: planForm.subscriptionStatus,
        billingExempt: planForm.billingExempt,
      };
      if (planForm.note.trim()) payload.note = planForm.note.trim();
      if (planForm.extendDays.trim()) payload.extendDays = Number(planForm.extendDays);

      const r = await fetch(`/api/super-admin/organizations/${planModal.org._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Couldn't update the subscription");

      toast({
        title: "Subscription updated",
        description: `${planModal.org.name} is now on ${PLAN_META[planForm.plan].name}.`,
        variant: "success",
      });
      setPlanModal({ open: false });
      load(search, page);
    } catch (e) {
      setPlanError(e instanceof Error ? e.message : "Couldn't update the subscription");
    } finally {
      setPlanBusy(false);
    }
  }

  async function runResend() {
    if (!resend.org) return;
    setResendBusy(true);
    try {
      const r = await fetch(`/api/super-admin/organizations/${resend.org._id}/resend`, { method: "POST" });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "resend failed");
      setResend({ open: false });
      if (d.emailSent === false && d.setupLink) {
        setResendResult({ email: d.email || resend.org.name, link: d.setupLink });
        toast({
          title: "New setup link created",
          description: "Email delivery failed — share the link manually.",
          variant: "warning",
        });
      } else {
        toast({ title: "Setup link sent", description: `A fresh link was sent to ${d.email}.`, variant: "success" });
      }
      load(search, page);
    } catch {
      toast({ title: "Unable to resend setup link", description: "Please try again shortly.", variant: "error" });
    } finally {
      setResendBusy(false);
    }
  }

  const load = useCallback(async (q: string, p: number) => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch(`/api/super-admin/organizations?search=${encodeURIComponent(q)}&page=${p}`);
      if (!r.ok) throw new Error();
      const d = await r.json();
      setOrgs(d.orgs || []);
      setTotal(d.total || 0);
      setPages(Math.max(1, d.pages || 1));
    } catch {
      setError("We couldn't load organizations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(search, page);
  }, [page, load]); // eslint-disable-line react-hooks/exhaustive-deps

  function apply() {
    setPage(1);
    load(search, 1);
  }

  async function run() {
    if (!confirm.org) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/super-admin/organizations/${confirm.org._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: confirm.next }),
      });
      if (!r.ok) throw new Error();
      toast({
        title: confirm.next === "SUSPENDED" ? "Organization suspended" : "Organization activated",
        description: `${confirm.org.name} ${confirm.next === "SUSPENDED" ? "can no longer sign in." : "is active again."}`,
        variant: confirm.next === "SUSPENDED" ? "warning" : "success",
      });
      setConfirm({ open: false, next: "SUSPENDED" });
      load(search, page);
    } catch {
      toast({ title: "Unable to update organization", variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  const columns: Column<Org>[] = [
    {
      key: "org",
      header: "Organization",
      render: (o) => (
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <Building2 className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate font-medium text-neutral-900">{o.name}</span>
              {o.billingExempt && (
                <span title="Billing-exempt workspace">
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-sky-500" />
                </span>
              )}
            </div>
            <div className="truncate text-[12.5px] text-neutral-500">{o.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "plan",
      header: "Plan",
      render: (o) => (
        <div className="flex flex-col items-start gap-1">
          <PlanBadge plan={o.plan} />
          <span className="text-[11.5px] text-neutral-500">{ghs(PLAN_META[o.plan || "STARTER"].priceGhs)}/mo</span>
        </div>
      ),
    },
    {
      key: "usage",
      header: "Usage",
      hideBelow: "md",
      render: (o) => {
        const meta = PLAN_META[o.plan || "STARTER"];
        return (
          <div className="space-y-0.5 text-[12.5px] tabular text-neutral-600">
            <div>
              Staff <span className="font-semibold text-neutral-900">{o.staffCount}</span>
              <span className="text-neutral-400"> / {limitLabel(meta.limits.staff)}</span>
            </div>
            <div>
              Managers <span className="font-semibold text-neutral-900">{o.managerCount ?? 0}</span>
              <span className="text-neutral-400"> / {limitLabel(meta.limits.managers)}</span>
            </div>
            <div>
              Branches <span className="font-semibold text-neutral-900">{o.branchCount ?? 0}</span>
              <span className="text-neutral-400"> / {limitLabel(meta.limits.branches)}</span>
            </div>
          </div>
        );
      },
    },
    {
      key: "subscription",
      header: "Subscription",
      hideBelow: "lg",
      render: (o) => (
        <div className="space-y-1">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-1 text-[11.5px] font-semibold capitalize ring-1 ring-inset",
              SUB_TONE[o.subscriptionStatus || "ACTIVE"] || SUB_TONE.ACTIVE
            )}
          >
            {(o.subscriptionStatus || "ACTIVE").toLowerCase().replace(/_/g, " ")}
          </span>
          <div className="text-[11.5px] text-neutral-500">
            Renews {dateLabel(o.currentPeriodEnd)}
          </div>
        </div>
      ),
    },
    { key: "status", header: "Status", render: (o) => <StatusBadge value={o.status} size="sm" /> },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (o) => (
        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="secondary" onClick={() => openPlanModal(o)}>
            <CreditCard className="h-3.5 w-3.5" /> Plan
          </Button>
          {o.pendingAdminEmail && (
            <Button
              size="sm"
              variant="outline"
              title={`Send a new setup link to ${o.pendingAdminEmail}`}
              onClick={() => setResend({ open: true, org: o })}
            >
              <Mail className="h-3.5 w-3.5" /> Resend
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setConfirm({ open: true, org: o, next: o.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE" });
            }}
          >
            {o.status === "ACTIVE" ? (
              <>
                <Ban className="h-3.5 w-3.5" /> Suspend
              </>
            ) : (
              <>
                <RotateCcw className="h-3.5 w-3.5" /> Activate
              </>
            )}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Organizations"
        description="Provision tenants, assign plans and keep an eye on subscription usage."
        actions={
          <LinkButton href="/super-admin/organizations/new">
            <Plus className="h-4 w-4" /> Create organization
          </LinkButton>
        }
      />

      <FilterBar
        right={
          <span className="text-[12.5px] font-medium text-neutral-500 tabular">
            {loading ? "Loading…" : `${total} organization${total === 1 ? "" : "s"}`}
          </span>
        }
      >
        <SearchInput
          label="Search organizations"
          placeholder="Search by name or email…"
          value={search}
          onChange={setSearch}
          onKeyDown={(e) => e.key === "Enter" && apply()}
          className="sm:w-80"
        />
        <Button size="sm" variant="secondary" onClick={apply}>
          Search
        </Button>
      </FilterBar>

      <Card>
        <CardContent className="px-0 pb-0 pt-4 sm:px-0">
          {error ? (
            <div className="px-5 pb-5">
              <ErrorState message={error} onRetry={() => load(search, page)} />
            </div>
          ) : (
            <>
              <div className="px-5 sm:px-6">
                <DataTable
                  columns={columns}
                  rows={orgs}
                  rowKey={(o) => o._id}
                  loading={loading}
                  empty={
                    <EmptyState
                      icon={search ? SearchX : Building2}
                      title={search ? "No organizations match your search" : "No organizations yet"}
                      description={
                        search
                          ? "Try a different name or email address."
                          : "Create your first tenant to start onboarding administrators."
                      }
                      action={
                        <LinkButton href="/super-admin/organizations/new" size="sm">
                          <Plus className="h-4 w-4" /> Create organization
                        </LinkButton>
                      }
                    />
                  }
                  renderMobile={(o) => (
                    <div className="rounded-xl border border-neutral-200/80 bg-white p-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                            <Building2 className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-neutral-900">{o.name}</div>
                            <div className="truncate text-[12.5px] text-neutral-500">
                              {o.email} · {o.staffCount} staff
                            </div>
                          </div>
                        </div>
                        <StatusBadge value={o.status} size="sm" />
                      </div>
                      <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        <PlanBadge plan={o.plan} />
                        <span className="text-[12px] text-neutral-500">
                          Renews {dateLabel(o.currentPeriodEnd)}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap justify-end gap-2">
                        <Button size="sm" variant="secondary" onClick={() => openPlanModal(o)}>
                          <CreditCard className="h-3.5 w-3.5" /> Plan
                        </Button>
                        {o.pendingAdminEmail && (
                          <Button size="sm" variant="outline" onClick={() => setResend({ open: true, org: o })}>
                            <Mail className="h-3.5 w-3.5" /> Resend
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setConfirm({ open: true, org: o, next: o.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE" })
                          }
                        >
                          {o.status === "ACTIVE" ? "Suspend" : "Activate"}
                        </Button>
                      </div>
                    </div>
                  )}
                />
              </div>
              {!loading && <TablePagination page={page} pages={pages} total={total} onPage={setPage} label="organizations" />}
            </>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirm.open}
        onOpenChange={(o) => setConfirm({ ...confirm, open: o })}
        loading={busy}
        destructive={confirm.next === "SUSPENDED"}
        title={confirm.next === "SUSPENDED" ? "Suspend organization?" : "Activate organization?"}
        description={
          confirm.org
            ? confirm.next === "SUSPENDED"
              ? `${confirm.org.name} and all of its administrators, managers and staff will be blocked from signing in. Existing data is kept.`
              : `${confirm.org.name} will be able to sign in again immediately.`
            : ""
        }
        confirmLabel={confirm.next === "SUSPENDED" ? "Suspend" : "Activate"}
        onConfirm={run}
      />

      {/* Plan + subscription management */}
      <Modal
        open={planModal.open}
        onOpenChange={(o) => {
          setPlanModal({ open: o });
          if (!o) setDetail(null);
        }}
        title={`Subscription — ${planModal.org?.name ?? ""}`}
        description="Assign a plan, change status or extend the renewal date. Every change is recorded in the plan history."
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPlanModal({ open: false })} disabled={planBusy}>
              Cancel
            </Button>
            <Button onClick={savePlan} loading={planBusy}>
              <CreditCard className="h-4 w-4" /> Save changes
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          {detailLoading ? (
            <div className="grid gap-3 sm:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-20 rounded-xl" />
              ))}
            </div>
          ) : detail?.subscription ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-neutral-200/80 p-3.5">
                <div className="text-[11.5px] font-semibold uppercase tracking-wide text-neutral-500">Staff</div>
                <div className="mt-1 text-lg font-semibold tabular text-neutral-900">
                  {detail.subscription.usage.staff}
                  <span className="text-[13px] font-normal text-neutral-400">
                    {" "}
                    / {limitLabel(detail.subscription.limits.staff)}
                  </span>
                </div>
              </div>
              <div className="rounded-xl border border-neutral-200/80 p-3.5">
                <div className="text-[11.5px] font-semibold uppercase tracking-wide text-neutral-500">Managers</div>
                <div className="mt-1 text-lg font-semibold tabular text-neutral-900">
                  {detail.subscription.usage.managers}
                  <span className="text-[13px] font-normal text-neutral-400">
                    {" "}
                    / {limitLabel(detail.subscription.limits.managers)}
                  </span>
                </div>
              </div>
              <div className="rounded-xl border border-neutral-200/80 p-3.5">
                <div className="text-[11.5px] font-semibold uppercase tracking-wide text-neutral-500">Branches</div>
                <div className="mt-1 text-lg font-semibold tabular text-neutral-900">
                  {detail.subscription.usage.branches}
                  <span className="text-[13px] font-normal text-neutral-400">
                    {" "}
                    / {limitLabel(detail.subscription.limits.branches)}
                  </span>
                </div>
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Plan" htmlFor="p-plan" className="sm:col-span-2">
              <div className="grid gap-2 sm:grid-cols-3">
                {(Object.keys(PLAN_META) as PlanId[]).map((id) => {
                  const meta = PLAN_META[id];
                  const active = planForm.plan === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setPlanForm((f) => ({ ...f, plan: id }))}
                      className={cn(
                        "rounded-xl border p-3 text-left transition",
                        active
                          ? "border-brand-500 bg-brand-50/60 ring-1 ring-brand-500/30"
                          : "border-neutral-200 hover:border-neutral-300"
                      )}
                      aria-pressed={active}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[13.5px] font-semibold text-neutral-900">{meta.name}</span>
                        <span className="text-[12px] font-semibold tabular text-neutral-700">
                          {ghs(meta.priceGhs)}
                        </span>
                      </div>
                      <div className="mt-1.5 space-y-0.5 text-[11.5px] text-neutral-500">
                        <div>{limitLabel(meta.limits.staff)} staff</div>
                        <div>{limitLabel(meta.limits.branches)} branches</div>
                        <div>
                          {meta.limits.historyMonths === null
                            ? "Unlimited history"
                            : `${meta.limits.historyMonths} months history`}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Field>

            <Field label="Subscription status" htmlFor="p-status">
              <Select
                id="p-status"
                value={planForm.subscriptionStatus}
                onChange={(e) => setPlanForm((f) => ({ ...f, subscriptionStatus: e.target.value }))}
              >
                <option value="ACTIVE">Active</option>
                <option value="PAST_DUE">Past due</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="CANCELLED">Cancelled</option>
              </Select>
            </Field>

            <Field label="Extend by (days)" htmlFor="p-extend" hint="Optional — adds to the current renewal date">
              <Input
                id="p-extend"
                type="number"
                min={1}
                max={730}
                value={planForm.extendDays}
                onChange={(e) => setPlanForm((f) => ({ ...f, extendDays: e.target.value }))}
                placeholder="30"
              />
            </Field>

            <label className="flex items-start gap-2.5 rounded-xl border border-neutral-200/80 p-3.5 sm:col-span-2">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-600"
                checked={planForm.billingExempt}
                onChange={(e) => setPlanForm((f) => ({ ...f, billingExempt: e.target.checked }))}
              />
              <span className="text-[13px] leading-relaxed text-neutral-600">
                <span className="font-semibold text-neutral-900">Billing exempt.</span> This workspace is managed
                directly by SamTech Labs and is not charged through Paystack — internal and test tenants.
              </span>
            </label>

            <Field label="Note (optional)" htmlFor="p-note" className="sm:col-span-2">
              <Textarea
                id="p-note"
                rows={2}
                value={planForm.note}
                onChange={(e) => setPlanForm((f) => ({ ...f, note: e.target.value }))}
                placeholder="Why is this changing? Shown in the plan history."
              />
            </Field>
          </div>

          <FormAlert message={planError} />

          <div>
            <div className="flex items-center gap-2 text-[13px] font-semibold text-neutral-900">
              <History className="h-4 w-4 text-neutral-400" /> Plan history
            </div>
            {detail?.events?.length ? (
              <ol className="mt-2.5 space-y-2.5">
                {detail.events.slice(0, 6).map((e) => {
                  const planName = (id?: string | null) =>
                    id ? (PLAN_META[id as PlanId]?.name ?? id) : null;
                  const humanStatus = (value?: string | null) =>
                    value ? value.toLowerCase().replace(/_/g, " ") : null;
                  const summary =
                    e.type === "STATUS_CHANGED"
                      ? humanStatus(e.fromStatus) && humanStatus(e.toStatus) &&
                        e.fromStatus !== e.toStatus
                        ? `${humanStatus(e.fromStatus)} → ${humanStatus(e.toStatus)}`
                        : null
                      : planName(e.toPlan)
                        ? `→ ${planName(e.toPlan)}`
                        : null;
                  return (
                    <li key={e._id} className="flex gap-2.5 text-[12.5px]">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                      <div className="min-w-0 text-neutral-600">
                        <span className="font-medium text-neutral-900">
                          {e.type.replace(/_/g, " ").toLowerCase()}
                        </span>
                        {summary ? ` ${summary}` : ""}
                        <span className="text-neutral-400"> · {dateLabel(e.createdAt)}</span>
                        {e.note ? <div className="text-neutral-500">{e.note}</div> : null}
                      </div>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="mt-2 rounded-lg bg-neutral-50 px-3 py-2 text-[12.5px] text-neutral-500">
                No plan changes recorded yet.
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-neutral-50 px-3 py-2 text-[12px] text-neutral-500">
            <CalendarClock className="h-3.5 w-3.5 shrink-0" />
            Current renewal: {dateLabel(planModal.org?.currentPeriodEnd)}
          </div>
        </div>
      </Modal>

      {/* Fresh setup link for a pending administrator */}
      <Modal
        open={resend.open}
        onOpenChange={(o) => setResend({ ...resend, open: o })}
        title="Send a new setup link?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setResend({ open: false })} disabled={resendBusy}>
              Cancel
            </Button>
            <Button onClick={runResend} loading={resendBusy}>
              <Mail className="h-4 w-4" /> {resendBusy ? "Sending…" : "Send new link"}
            </Button>
          </>
        }
      >
        <p className="text-[14px] leading-relaxed text-neutral-600">
          {resend.org
            ? `A fresh 72-hour setup link will be created for ${resend.org.pendingAdminEmail || resend.org.name}. Any previous unused links stop working immediately.`
            : ""}
        </p>
      </Modal>

      {/* Manual setup link when email couldn't be delivered */}
      <Modal
        open={!!resendResult}
        onOpenChange={(o) => {
          if (!o) setResendResult(null);
        }}
        title="Share the setup link"
        size="sm"
        footer={<Button onClick={() => setResendResult(null)}>Done</Button>}
      >
        {resendResult && <SetupLinkPanel link={resendResult.link} email={resendResult.email} />}
      </Modal>
    </div>
  );
}
