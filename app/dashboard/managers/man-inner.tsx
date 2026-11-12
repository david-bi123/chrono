"use client";
import { useCallback, useEffect, useState } from "react";
import { UserCog, UserPlus, Building2, Mail, ShieldCheck, Trash2, Infinity as InfinityIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Field, Input, Select, FormAlert } from "@/components/ui/input";
import { Modal, ConfirmDialog } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { SetupLinkPanel, SpamNotice } from "@/components/ui/spam-notice";
import { cn } from "@/lib/utils";

type Manager = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  status: string;
  locationId: string | null;
  locationName: string | null;
  createdAt: string;
};

type Location = { _id: string; name: string; status: string };

type Subscription = {
  usage: { managers: number };
  limits: { managers: number | null };
  plan: { id: string; name: string };
};

const EMPTY = { firstName: "", lastName: "", email: "", phone: "", locationId: "" };

export default function ManagersPage() {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [inviteOpen, setInviteOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [formError, setFormError] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<{ email: string; name: string; emailSent: boolean; setupLink?: string } | null>(null);

  const [confirm, setConfirm] = useState<{ open: boolean; manager?: Manager }>({ open: false });
  const [confirmBusy, setConfirmBusy] = useState(false);

  const { toast } = useToast();

  const load = useCallback(async () => {
    try {
      setError("");
      const [mRes, lRes, sRes] = await Promise.all([
        fetch("/api/org/managers"),
        fetch("/api/org/locations"),
        fetch("/api/org/subscription"),
      ]);
      if (!mRes.ok) {
        const b = await mRes.json().catch(() => ({}));
        throw new Error(b.error || "Couldn't load managers");
      }
      const m = await mRes.json();
      setManagers(m.managers || []);
      if (lRes.ok) {
        const l = await lRes.json();
        setLocations(l.locations || []);
      }
      if (sRes.ok) {
        const s = await sRes.json();
        setSubscription(s.subscription || null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load managers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSending(true);
    try {
      const res = await fetch("/api/org/managers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          locationId: form.locationId || null,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (body.code === "PLAN_LIMIT_REACHED") {
          setFormError(
            `${body.error} Upgrade to ${body.details?.upgradeTo ?? "a higher plan"} to add more managers.`
          );
        } else {
          setFormError(body.error || "Couldn't send the invitation");
        }
        return;
      }
      setInviteOpen(false);
      setForm(EMPTY);
      setSent({
        email: form.email,
        name: `${form.firstName} ${form.lastName}`,
        emailSent: body.emailSent !== false,
        setupLink: body.setupLink,
      });
      toast({ title: "Manager invited", description: `${form.firstName} can now set up their account.`, variant: "success" });
      load();
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  }

  async function disable() {
    if (!confirm.manager) return;
    setConfirmBusy(true);
    try {
      const res = await fetch(`/api/org/managers/${confirm.manager._id}`, { method: "DELETE" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Couldn't remove this manager");
      toast({
        title: "Manager removed",
        description: `${confirm.manager.firstName} no longer has access. Their history is preserved.`,
        variant: "success",
      });
      setConfirm({ open: false });
      load();
    } catch (e) {
      toast({
        title: "Couldn't remove manager",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "error",
      });
    } finally {
      setConfirmBusy(false);
    }
  }

  const used = subscription?.usage.managers ?? managers.length;
  const limit = subscription?.limits.managers ?? null;
  const atLimit = limit !== null && used >= limit;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Managers"
        description="Managers can see attendance, staff and reports across your workspace. They cannot change settings, invite staff or manage billing."
        actions={
          <Button onClick={() => setInviteOpen(true)} disabled={atLimit}>
            <UserPlus className="h-4 w-4" /> Invite manager
          </Button>
        }
      />

      {subscription && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-neutral-200/80 bg-white px-4 py-3 text-[13px] text-neutral-600">
          <ShieldCheck className="h-4 w-4 shrink-0 text-brand-600" />
          <span>
            <span className="font-semibold text-neutral-900">
              {used} {limit === null ? "of unlimited" : `of ${limit}`}
            </span>{" "}
            manager seats used on the {subscription.plan.name} plan.
          </span>
          {atLimit && (
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[12px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-100">
              Limit reached — upgrade to add more
            </span>
          )}
        </div>
      )}

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-20 rounded-xl" />
          ))}
        </div>
      ) : managers.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <EmptyState
              icon={UserCog}
              title="No managers yet"
              description="Invite a manager so supervisors can monitor attendance without touching your settings."
              action={
                <Button onClick={() => setInviteOpen(true)} disabled={atLimit}>
                  <UserPlus className="h-4 w-4" /> Invite manager
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {managers.map((m) => (
            <Card key={m._id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-[15px] font-semibold tracking-[-0.01em] text-neutral-900">
                    {m.firstName} {m.lastName}
                  </div>
                  <div className="mt-0.5 truncate text-[13px] text-neutral-500">{m.email}</div>
                </div>
                <StatusBadge value={m.status} size="sm" />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-1 text-[12px] font-medium text-neutral-600">
                  <Building2 className="h-3.5 w-3.5 text-neutral-400" />
                  {m.locationName || "All branches"}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-1 text-[12px] font-medium text-neutral-600">
                  <ShieldCheck className="h-3.5 w-3.5 text-neutral-400" /> Read-only oversight
                </span>
              </div>

              <div className="mt-4 flex justify-end border-t border-neutral-100 pt-3">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => setConfirm({ open: true, manager: m })}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove access
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Invite modal */}
      <Modal
        open={inviteOpen}
        onOpenChange={(o) => {
          setInviteOpen(o);
          if (!o) setFormError("");
        }}
        title="Invite a manager"
        description="They'll receive a single-use link to set their password. Managers see attendance and reports only."
        footer={
          <>
            <Button variant="secondary" onClick={() => setInviteOpen(false)} disabled={sending}>
              Cancel
            </Button>
            <Button type="submit" form="manager-form" loading={sending}>
              <Mail className="h-4 w-4" /> Send invitation
            </Button>
          </>
        }
      >
        <form id="manager-form" onSubmit={invite} className="grid gap-4 sm:grid-cols-2">
          <FormAlert message={formError} className="sm:col-span-2" />
          <Field label="First name" htmlFor="m-first" required>
            <Input
              id="m-first"
              required
              value={form.firstName}
              onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
            />
          </Field>
          <Field label="Last name" htmlFor="m-last" required>
            <Input
              id="m-last"
              required
              value={form.lastName}
              onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
            />
          </Field>
          <Field label="Work email" htmlFor="m-email" required className="sm:col-span-2">
            <Input
              id="m-email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </Field>
          <Field label="Phone (optional)" htmlFor="m-phone">
            <Input
              id="m-phone"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </Field>
          <Field label="Branch" htmlFor="m-loc" hint="Leave empty for all branches">
            <Select
              id="m-loc"
              value={form.locationId}
              onChange={(e) => setForm((f) => ({ ...f, locationId: e.target.value }))}
            >
              <option value="">All branches</option>
              {locations.map((l) => (
                <option key={l._id} value={l._id}>
                  {l.name}
                </option>
              ))}
            </Select>
          </Field>
          {limit !== null && (
            <p className="sm:col-span-2 text-[12.5px] text-neutral-500">
              {used} of {limit} manager seats used on the {subscription?.plan.name} plan.
            </p>
          )}
          {limit === null && (
            <p className="flex items-center gap-1.5 sm:col-span-2 text-[12.5px] text-neutral-500">
              <InfinityIcon className="h-3.5 w-3.5" /> Unlimited manager seats on this plan.
            </p>
          )}
        </form>
      </Modal>

      {/* Invite sent */}
      <Modal
        open={!!sent}
        onOpenChange={(o) => !o && setSent(null)}
        title="Invitation sent"
        size="sm"
        footer={
          <Button onClick={() => setSent(null)}>
            Done
          </Button>
        }
      >
        <div className="space-y-3 text-[14px] leading-relaxed text-neutral-600">
          <p>
            <span className="font-semibold text-neutral-900">{sent?.name}</span> has been invited as a manager.
          </p>
          {sent?.emailSent ? (
            <SpamNotice email={sent.email} />
          ) : sent?.setupLink ? (
            <SetupLinkPanel link={sent.setupLink} email={sent.email} />
          ) : null}
          <p className="text-[12.5px] text-neutral-500">
            The link expires in 72 hours and can only be used once.
          </p>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirm.open}
        onOpenChange={(o) => setConfirm({ open: o })}
        title="Remove manager access?"
        description={`${
          confirm.manager?.firstName ?? "This manager"
        } will lose access to the workspace immediately. Their attendance history and audit trail are preserved.`}
        confirmLabel="Remove access"
        destructive
        loading={confirmBusy}
        onConfirm={disable}
      />
    </div>
  );
}
