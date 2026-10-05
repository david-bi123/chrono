"use client";
import { useEffect, useState } from "react";
import { Building2, Clock3, ShieldCheck, Check } from "lucide-react";
import { Input, Select, Textarea, Field, Label, PasswordInput } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { key: "organization", label: "Organization", icon: Building2, desc: "Name, contact details and timezone" },
  { key: "attendance", label: "Attendance", icon: Clock3, desc: "Work hours, grace period and working days" },
  { key: "security", label: "Security", icon: ShieldCheck, desc: "Change your password" },
] as const;

type SectionKey = (typeof SECTIONS)[number]["key"];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const TIMEZONES = [
  "Africa/Accra",
  "Africa/Lagos",
  "Africa/Nairobi",
  "Africa/Cairo",
  "Africa/Johannesburg",
  "Europe/London",
  "UTC",
];

type OrgForm = {
  name: string;
  email: string;
  phone: string;
  address: string;
  industry: string;
  timezone: string;
};

type AttForm = {
  workStart: string;
  workEnd: string;
  graceMinutes: number;
  workingDays: number[];
  requireClockOut: boolean;
};

export default function SettingsPage() {
  const { toast } = useToast();
  const [active, setActive] = useState<SectionKey>("organization");
  const [loading, setLoading] = useState(true);
  const [org, setOrg] = useState<OrgForm | null>(null);
  const [att, setAtt] = useState<AttForm | null>(null);
  const [savingOrg, setSavingOrg] = useState(false);
  const [savingAtt, setSavingAtt] = useState(false);
  const [orgError, setOrgError] = useState("");
  const [attError, setAttError] = useState("");

  useEffect(() => {
    fetch("/api/org/settings")
      .then((r) => r.json())
      .then((d) => {
        if (!d.org) return;
        const a = (d.org.attendanceSettings || {}) as Record<string, unknown>;
        setOrg({
          name: String(d.org.name || ""),
          email: String(d.org.email || ""),
          phone: String(d.org.phone || ""),
          address: String(d.org.address || ""),
          industry: String(d.org.industry || ""),
          timezone: String(d.org.timezone || a.timezone || "Africa/Accra"),
        });
        setAtt({
          workStart: String(a.workStart || "08:00"),
          workEnd: String(a.workEnd || "17:00"),
          graceMinutes: Number(a.graceMinutes ?? 15),
          workingDays: Array.isArray(a.workingDays) ? (a.workingDays as number[]) : [1, 2, 3, 4, 5],
          requireClockOut: Boolean(a.requireClockOut ?? true),
        });
      })
      .catch(() => toast({ title: "Couldn't load settings", variant: "error" }))
      .finally(() => setLoading(false));
  }, [toast]);

  async function saveOrg(e: React.FormEvent) {
    e.preventDefault();
    if (!org) return;
    setSavingOrg(true);
    setOrgError("");
    try {
      const r = await fetch("/api/org/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ org }),
      });
      if (!r.ok) throw new Error();
      toast({ title: "Organization settings saved", variant: "success" });
    } catch {
      setOrgError("We couldn't save these settings. Please try again.");
    } finally {
      setSavingOrg(false);
    }
  }

  async function saveAtt(e: React.FormEvent) {
    e.preventDefault();
    if (!att) return;
    setSavingAtt(true);
    setAttError("");
    try {
      const r = await fetch("/api/org/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attendance: {
            workStart: att.workStart,
            workEnd: att.workEnd,
            graceMinutes: Number(att.graceMinutes),
            workingDays: att.workingDays,
            requireClockOut: att.requireClockOut,
          },
        }),
      });
      if (!r.ok) throw new Error();
      toast({ title: "Attendance rules saved", description: "New rules apply to future clock-ins.", variant: "success" });
    } catch {
      setAttError("We couldn't save these rules. Check the values and try again.");
    } finally {
      setSavingAtt(false);
    }
  }

  function toggleDay(d: number) {
    if (!att) return;
    const has = att.workingDays.includes(d);
    const next = has ? att.workingDays.filter((x) => x !== d) : [...att.workingDays, d].sort();
    if (next.length === 0) {
      setAttError("Select at least one working day.");
      return;
    }
    setAttError("");
    setAtt({ ...att, workingDays: next });
  }

  if (loading || !org || !att) {
    return (
      <div className="space-y-5">
        <div className="space-y-2.5">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your organization profile, attendance rules and account security." />

      <div className="grid gap-6 lg:grid-cols-[236px_minmax(0,1fr)]">
        {/* Settings nav */}
        <nav aria-label="Settings sections" className="lg:sticky lg:top-24 lg:self-start">
          <ul className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
            {SECTIONS.map((s) => {
              const isActive = active === s.key;
              return (
                <li key={s.key} className="shrink-0 lg:shrink">
                  <button
                    onClick={() => setActive(s.key)}
                    aria-current={isActive ? "true" : undefined}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[13.5px] font-medium transition-colors",
                      isActive
                        ? "bg-brand-50 text-brand-700"
                        : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                    )}
                  >
                    <s.icon
                      className={cn("h-[17px] w-[17px] shrink-0", isActive ? "text-brand-600" : "text-neutral-500")}
                    />
                    <span className="whitespace-nowrap">{s.label}</span>
                  </button>
                  <p className="hidden pl-9 pr-2 pt-0.5 text-[11.5px] leading-snug text-neutral-500 lg:block">
                    {s.desc}
                  </p>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Section content */}
        <div className="min-w-0">
          {active === "organization" && (
            <Card>
              <CardHeader>
                <CardTitle>Organization</CardTitle>
                <CardDescription>These details appear on invitations, reports and the QR sheet.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={saveOrg} className="grid gap-4 sm:grid-cols-2">
                  <Field label="Organization name" htmlFor="s-name" required className="sm:col-span-2">
                    <Input id="s-name" required value={org.name} onChange={(e) => setOrg({ ...org, name: e.target.value })} />
                  </Field>
                  <Field label="Contact email" htmlFor="s-email" required>
                    <Input
                      id="s-email"
                      type="email"
                      required
                      value={org.email}
                      onChange={(e) => setOrg({ ...org, email: e.target.value })}
                    />
                  </Field>
                  <Field label="Phone" htmlFor="s-phone">
                    <Input id="s-phone" type="tel" value={org.phone} onChange={(e) => setOrg({ ...org, phone: e.target.value })} />
                  </Field>
                  <Field label="Industry" htmlFor="s-industry">
                    <Input
                      id="s-industry"
                      placeholder="e.g. Technology"
                      value={org.industry}
                      onChange={(e) => setOrg({ ...org, industry: e.target.value })}
                    />
                  </Field>
                  <Field label="Timezone" htmlFor="s-tz" hint="Attendance dates and times use this timezone.">
                    <Input
                      id="s-tz"
                      list="tz-options"
                      value={org.timezone}
                      onChange={(e) => setOrg({ ...org, timezone: e.target.value })}
                    />
                    <datalist id="tz-options">
                      {TIMEZONES.map((t) => (
                        <option key={t} value={t} />
                      ))}
                    </datalist>
                  </Field>
                  <Field label="Address" htmlFor="s-address" className="sm:col-span-2">
                    <Textarea
                      id="s-address"
                      rows={2}
                      value={org.address}
                      onChange={(e) => setOrg({ ...org, address: e.target.value })}
                    />
                  </Field>
                  {orgError && (
                    <p className="text-[13px] font-medium text-red-600 sm:col-span-2" role="alert">
                      {orgError}
                    </p>
                  )}
                  <div className="sm:col-span-2">
                    <Button type="submit" loading={savingOrg}>
                      Save changes
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {active === "attendance" && (
            <Card>
              <CardHeader>
                <CardTitle>Attendance rules</CardTitle>
                <CardDescription>These rules determine how late, early and incomplete days are flagged.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={saveAtt} className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="Work start" htmlFor="s-start" required hint="HH:MM, 24-hour">
                      <Input
                        id="s-start"
                        type="time"
                        required
                        value={att.workStart}
                        onChange={(e) => setAtt({ ...att, workStart: e.target.value })}
                      />
                    </Field>
                    <Field label="Work end" htmlFor="s-end" required hint="HH:MM, 24-hour">
                      <Input
                        id="s-end"
                        type="time"
                        required
                        value={att.workEnd}
                        onChange={(e) => setAtt({ ...att, workEnd: e.target.value })}
                      />
                    </Field>
                    <Field label="Grace period" htmlFor="s-grace" hint="Minutes allowed before 'Late'">
                      <Input
                        id="s-grace"
                        type="number"
                        min={0}
                        max={120}
                        required
                        value={att.graceMinutes}
                        onChange={(e) => setAtt({ ...att, graceMinutes: Number(e.target.value) })}
                      />
                    </Field>
                  </div>

                  <div>
                    <Label>Working days</Label>
                    <div className="flex flex-wrap gap-2">
                      {DAY_NAMES.map((d, i) => {
                        const on = att.workingDays.includes(i);
                        return (
                          <button
                            key={d}
                            type="button"
                            aria-pressed={on}
                            onClick={() => toggleDay(i)}
                            className={cn(
                              "flex h-9 min-w-[52px] items-center justify-center rounded-lg border px-3 text-[13px] font-semibold transition",
                              on
                                ? "border-brand-600 bg-brand-600 text-white"
                                : "border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300 hover:text-neutral-800"
                            )}
                          >
                            {on && <Check className="mr-1 h-3.5 w-3.5" />}
                            {d}
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-1.5 text-xs text-neutral-500">
                      Days without a clock-in on these dates are flagged as absences.
                    </p>
                  </div>

                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-neutral-200 bg-neutral-50/60 p-3.5">
                    <input
                      type="checkbox"
                      checked={att.requireClockOut}
                      onChange={(e) => setAtt({ ...att, requireClockOut: e.target.checked })}
                      className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-600"
                    />
                    <span>
                      <span className="block text-[13.5px] font-medium text-neutral-800">Require clock-out</span>
                      <span className="block text-[12.5px] leading-relaxed text-neutral-500">
                        Shifts without a clock-out stay marked <strong>Incomplete</strong> until corrected.
                      </span>
                    </span>
                  </label>

                  {attError && (
                    <p className="text-[13px] font-medium text-red-600" role="alert">
                      {attError}
                    </p>
                  )}

                  <Button type="submit" loading={savingAtt}>
                    Save attendance rules
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {active === "security" && <SecuritySection />}
        </div>
      </div>
    </div>
  );
}

function SecuritySection() {
  const { toast } = useToast();
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (pw.next !== pw.confirm) {
      setError("New passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/staff/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: pw.current, newPassword: pw.next }),
      });
      const d = await r.json();
      if (!r.ok) {
        setError(d.error || "We couldn't change your password.");
        return;
      }
      setPw({ current: "", next: "", confirm: "" });
      toast({ title: "Password changed", description: "Use it the next time you sign in.", variant: "success" });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change password</CardTitle>
        <CardDescription>Minimum 8 characters with an uppercase letter, lowercase letter and number.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid max-w-lg gap-4">
          <Field label="Current password" htmlFor="p-current" required>
            <PasswordInput
              id="p-current"
              autoComplete="current-password"
              required
              value={pw.current}
              onChange={(e) => setPw({ ...pw, current: e.target.value })}
            />
          </Field>
          <Field label="New password" htmlFor="p-new" required>
            <PasswordInput
              id="p-new"
              autoComplete="new-password"
              required
              value={pw.next}
              onChange={(e) => setPw({ ...pw, next: e.target.value })}
            />
          </Field>
          <Field label="Confirm new password" htmlFor="p-confirm" required error={error}>
            <PasswordInput
              id="p-confirm"
              autoComplete="new-password"
              required
              value={pw.confirm}
              onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
            />
          </Field>
          <div>
            <Button type="submit" loading={busy}>
              Update password
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
