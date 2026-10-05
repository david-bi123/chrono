"use client";
import { useEffect, useState } from "react";
import { UserRound, ShieldCheck, Save } from "lucide-react";
import { Input, Field, PasswordInput } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";

type Profile = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  employeeId?: string;
  department?: string;
  position?: string;
  status: string;
};

export default function ProfilePage() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwBusy, setPwBusy] = useState(false);
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    fetch("/api/staff/profile")
      .then((r) => r.json())
      .then((d) => {
        if (!d.profile) return;
        setProfile(d.profile);
        setForm({
          firstName: d.profile.firstName || "",
          lastName: d.profile.lastName || "",
          phone: d.profile.phone || "",
        });
      })
      .catch(() => toast({ title: "Couldn't load your profile", variant: "error" }));
  }, [toast]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await fetch("/api/staff/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!r.ok) throw new Error();
      toast({ title: "Profile saved", variant: "success" });
    } catch {
      toast({ title: "Couldn't save changes", description: "Please try again.", variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function changePw(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    if (pw.next !== pw.confirm) {
      setPwError("New passwords don't match.");
      return;
    }
    setPwBusy(true);
    try {
      const r = await fetch("/api/staff/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: pw.current, newPassword: pw.next }),
      });
      const d = await r.json();
      if (!r.ok) {
        setPwError(d.error || "We couldn't change your password.");
        return;
      }
      setPw({ current: "", next: "", confirm: "" });
      toast({ title: "Password changed", variant: "success" });
    } catch {
      setPwError("Network error. Please try again.");
    } finally {
      setPwBusy(false);
    }
  }

  if (!profile) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const name = `${profile.firstName} ${profile.lastName}`;

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" description="Your personal details, account information and security." />

      <Card>
        <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center">
          <Avatar name={name} email={profile.email} size="xl" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="text-lg font-semibold tracking-[-0.02em] text-neutral-900">{name}</div>
              <StatusBadge value={profile.status} size="sm" />
            </div>
            <div className="mt-1 text-[13.5px] text-neutral-500">
              {profile.position || "Staff member"}
              {profile.department ? ` · ${profile.department}` : ""}
            </div>
            <div className="mt-1 text-[13px] text-neutral-500">{profile.email}</div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="h-4 w-4 text-neutral-500" /> Personal information
            </CardTitle>
            <CardDescription>Update the details your organization has on file.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={save} className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="First name" htmlFor="pf-first" required>
                  <Input
                    id="pf-first"
                    required
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  />
                </Field>
                <Field label="Last name" htmlFor="pf-last" required>
                  <Input
                    id="pf-last"
                    required
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  />
                </Field>
              </div>
              <Field label="Phone" htmlFor="pf-phone">
                <Input
                  id="pf-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Email" htmlFor="pf-email" hint="Contact your admin to change this.">
                  <Input id="pf-email" value={profile.email} disabled />
                </Field>
                <Field label="Employee ID" htmlFor="pf-id" hint="Assigned by your administrator.">
                  <Input id="pf-id" value={profile.employeeId || ""} disabled />
                </Field>
                <Field label="Department" htmlFor="pf-dept">
                  <Input id="pf-dept" value={profile.department || ""} disabled />
                </Field>
                <Field label="Position" htmlFor="pf-pos">
                  <Input id="pf-pos" value={profile.position || ""} disabled />
                </Field>
              </div>
              <div>
                <Button type="submit" loading={saving}>
                  <Save className="h-4 w-4" /> Save changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-neutral-500" /> Change password
            </CardTitle>
            <CardDescription>Minimum 8 characters with uppercase, lowercase and a number.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={changePw} className="grid gap-4">
              <Field label="Current password" htmlFor="pw-current" required>
                <PasswordInput
                  id="pw-current"
                  autoComplete="current-password"
                  required
                  value={pw.current}
                  onChange={(e) => setPw({ ...pw, current: e.target.value })}
                />
              </Field>
              <Field label="New password" htmlFor="pw-new" required>
                <PasswordInput
                  id="pw-new"
                  autoComplete="new-password"
                  required
                  value={pw.next}
                  onChange={(e) => setPw({ ...pw, next: e.target.value })}
                />
              </Field>
              <Field label="Confirm new password" htmlFor="pw-confirm" required error={pwError}>
                <PasswordInput
                  id="pw-confirm"
                  autoComplete="new-password"
                  required
                  value={pw.confirm}
                  onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
                />
              </Field>
              <div>
                <Button type="submit" variant="secondary" loading={pwBusy}>
                  Update password
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
