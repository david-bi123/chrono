"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus, MoreHorizontal, Mail, Ban, RotateCcw, Eye, Users } from "lucide-react";
import { Input, Select, Field } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { PageHeader, FilterBar, SearchInput } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { Modal, ConfirmDialog } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import { useToast } from "@/components/ui/toast";
import { SpamNotice, SetupLinkPanel } from "@/components/ui/spam-notice";

interface Staff {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeId?: string;
  department?: string;
  position?: string;
  phone?: string;
  status: string;
  createdAt?: string;
}

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  employeeId: "",
  department: "",
  position: "",
  phone: "",
};

export default function StaffPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [staff, setStaff] = useState<Staff[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [inviteOpen, setInviteOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const [sentName, setSentName] = useState("");
  const [sentLink, setSentLink] = useState<string | null>(null);
  const [resendResult, setResendResult] = useState<{ email: string; link: string } | null>(null);

  const [confirm, setConfirm] = useState<{ open: boolean; staff?: Staff; next: "ACTIVE" | "DISABLED" }>({
    open: false,
    next: "DISABLED",
  });
  const [confirmBusy, setConfirmBusy] = useState(false);

  const load = useCallback(async (q: { search: string; dept: string; status: string }) => {
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams();
      if (q.search) qs.set("search", q.search);
      if (q.dept) qs.set("department", q.dept);
      if (q.status) qs.set("status", q.status);
      const r = await fetch(`/api/org/staff?${qs}`);
      if (!r.ok) throw new Error();
      const d = await r.json();
      setStaff(d.staff || []);
      setDepartments(d.departments || []);
    } catch {
      setError("We couldn't load your staff list.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load({ search, dept, status });
  }, [dept, status, load]); // eslint-disable-line react-hooks/exhaustive-deps

  function applySearch() {
    load({ search, dept, status });
  }

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSending(true);
    try {
      const r = await fetch("/api/org/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!r.ok) {
        setFormError(d.error || "We couldn't send the invitation. Please try again.");
        return;
      }
      const emailSent = d.emailSent !== false;
      setSentTo(form.email);
      setSentName(form.firstName);
      setSentLink(emailSent ? null : d.setupLink || null);
      setForm(EMPTY_FORM);
      setInviteOpen(false);
      toast(
        emailSent
          ? { title: "Invitation sent", description: `${form.firstName} has been invited.`, variant: "success" }
          : {
              title: "Invitation created",
              description: "Email delivery failed — share the setup link manually.",
              variant: "warning",
            }
      );
      load({ search, dept, status });
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  }

  async function toggle() {
    if (!confirm.staff) return;
    const next = confirm.next;
    setConfirmBusy(true);
    try {
      const r = await fetch(`/api/org/staff/${confirm.staff._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!r.ok) throw new Error();
      toast({
        title: next === "DISABLED" ? "Staff member deactivated" : "Staff member reactivated",
        description:
          next === "DISABLED"
            ? `${confirm.staff.firstName} can no longer clock in.`
            : `${confirm.staff.firstName} can clock in again.`,
        variant: next === "DISABLED" ? "warning" : "success",
      });
      setConfirm({ open: false, next: "DISABLED" });
      load({ search, dept, status });
    } catch {
      toast({ title: "Unable to update status", description: "Please try again.", variant: "error" });
    } finally {
      setConfirmBusy(false);
    }
  }

  async function resend(s: Staff) {
    try {
      const r = await fetch(`/api/org/staff/${s._id}/resend`, { method: "POST" });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "resend failed");
      if (d.emailSent === false && d.setupLink) {
        setResendResult({ email: s.email, link: d.setupLink });
        toast({
          title: "Invitation recreated",
          description: "Email delivery failed — share the setup link manually.",
          variant: "warning",
        });
      } else {
        toast({ title: "Invitation resent", description: `A new link was sent to ${s.email}.`, variant: "success" });
      }
    } catch {
      toast({ title: "Unable to resend invitation", description: "Please try again shortly.", variant: "error" });
    }
  }

  const columns: Column<Staff>[] = [
    {
      key: "employee",
      header: "Employee",
      render: (s) => (
        <div className="flex items-center gap-3">
          <Avatar name={`${s.firstName} ${s.lastName}`} email={s.email} size="sm" />
          <div className="min-w-0">
            <div className="truncate font-medium text-neutral-900">
              {s.firstName} {s.lastName}
            </div>
            <div className="truncate text-[11.5px] text-neutral-500">{s.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "employeeId",
      header: "Employee ID",
      hideBelow: "lg",
      render: (s) => <span className="font-mono text-[12.5px] text-neutral-600">{s.employeeId || "—"}</span>,
    },
    {
      key: "department",
      header: "Department",
      hideBelow: "md",
      render: (s) => <span className="text-neutral-600">{s.department || "—"}</span>,
    },
    {
      key: "position",
      header: "Position",
      hideBelow: "xl",
      render: (s) => <span className="text-neutral-600">{s.position || "—"}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (s) => <StatusBadge value={s.status} size="sm" />,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (s) => (
        <div className="flex items-center justify-end gap-1">
          {s.status === "PENDING" && (
            <Button size="sm" variant="outline" onClick={() => resend(s)}>
              <Mail className="h-3.5 w-3.5" /> Resend
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon-sm" variant="ghost" aria-label={`Actions for ${s.firstName}`}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={() => router.push(`/dashboard/staff/${s._id}`)}>
                <Eye className="h-4 w-4 text-neutral-500" /> View profile
              </DropdownMenuItem>
              {s.status === "PENDING" && (
                <DropdownMenuItem onSelect={() => resend(s)}>
                  <Mail className="h-4 w-4 text-neutral-500" /> Resend invitation
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() =>
                  setConfirm({
                    open: true,
                    staff: s,
                    next: s.status === "DISABLED" ? "ACTIVE" : "DISABLED",
                  })
                }
                className={s.status === "DISABLED" ? "" : "text-red-600 focus:text-red-600"}
              >
                {s.status === "DISABLED" ? (
                  <>
                    <RotateCcw className="h-4 w-4" /> Reactivate
                  </>
                ) : (
                  <>
                    <Ban className="h-4 w-4" /> Deactivate
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Staff"
        description="Manage your organization's employees, invitations and access."
        actions={
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4" /> Invite staff
          </Button>
        }
      />

      <FilterBar>
        <SearchInput
          label="Search staff"
          placeholder="Search name, email or ID…"
          value={search}
          onChange={setSearch}
          onKeyDown={(e) => e.key === "Enter" && applySearch()}
          className="sm:w-72"
        />
        <div className="w-[168px]">
          <Select aria-label="Filter by department" value={dept} onChange={(e) => setDept(e.target.value)}>
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-[152px]">
          <Select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending</option>
            <option value="DISABLED">Disabled</option>
          </Select>
        </div>
        <Button size="sm" variant="secondary" onClick={applySearch}>
          Apply
        </Button>
      </FilterBar>

      <Card>
        <CardContent className="px-0 pb-0 pt-4 sm:px-0">
          {error ? (
            <div className="px-5 pb-5">
              <ErrorState message={error} onRetry={() => load({ search, dept, status })} />
            </div>
          ) : (
            <div className="px-5 sm:px-6">
              <DataTable
                columns={columns}
                rows={staff}
                rowKey={(s) => s._id}
                loading={loading}
                onRowClick={(s) => router.push(`/dashboard/staff/${s._id}`)}
                empty={
                  search || dept || status ? (
                    <EmptyState
                      icon={Users}
                      title="No staff match these filters"
                      description="Try a different search term, or clear the filters to see your whole team."
                      action={
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setSearch("");
                            setDept("");
                            setStatus("");
                            load({ search: "", dept: "", status: "" });
                          }}
                        >
                          Clear filters
                        </Button>
                      }
                    />
                  ) : (
                    <EmptyState
                      icon={UserPlus}
                      title="No staff members yet"
                      description="Invite your first team member to start managing attendance."
                      action={
                        <Button onClick={() => setInviteOpen(true)}>
                          <UserPlus className="h-4 w-4" /> Invite staff
                        </Button>
                      }
                    />
                  )
                }
                renderMobile={(s) => (
                  <div className="rounded-xl border border-neutral-200/80 bg-white p-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <button
                        className="flex min-w-0 items-center gap-2.5 text-left"
                        onClick={() => router.push(`/dashboard/staff/${s._id}`)}
                      >
                        <Avatar name={`${s.firstName} ${s.lastName}`} email={s.email} size="sm" />
                        <span className="min-w-0">
                          <span className="block truncate text-[13.5px] font-semibold text-neutral-900">
                            {s.firstName} {s.lastName}
                          </span>
                          <span className="block truncate text-[11.5px] text-neutral-500">
                            {s.employeeId || s.email}
                          </span>
                        </span>
                      </button>
                      <StatusBadge value={s.status} size="sm" />
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3 border-t border-neutral-100 pt-3">
                      <span className="truncate text-[12.5px] text-neutral-500">
                        {s.department || "No department"}
                        {s.position ? ` · ${s.position}` : ""}
                      </span>
                      <div className="flex shrink-0 gap-2">
                        {s.status === "PENDING" && (
                          <Button size="sm" variant="outline" onClick={() => resend(s)}>
                            Resend
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/dashboard/staff/${s._id}`)}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite modal */}
      <Modal
        open={inviteOpen}
        onOpenChange={(o) => {
          if (!sending) {
            setInviteOpen(o);
            if (!o) setFormError("");
          }
        }}
        title="Invite staff member"
        description="They'll receive a secure, single-use invitation link to set up their account."
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setInviteOpen(false)} disabled={sending}>
              Cancel
            </Button>
            <Button type="submit" form="invite-form" loading={sending}>
              <UserPlus className="h-4 w-4" /> Send invitation
            </Button>
          </>
        }
      >
        <form id="invite-form" onSubmit={invite} className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" htmlFor="f-first" required>
            <Input
              id="f-first"
              required
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            />
          </Field>
          <Field label="Last name" htmlFor="f-last" required>
            <Input
              id="f-last"
              required
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            />
          </Field>
          <Field label="Work email" htmlFor="f-email" required className="sm:col-span-2">
            <Input
              id="f-email"
              type="email"
              required
              placeholder="name@company.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>
          <Field label="Employee ID" htmlFor="f-id" required hint="Must be unique within your organization.">
            <Input
              id="f-id"
              required
              placeholder="e.g. ACME-006"
              value={form.employeeId}
              onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
            />
          </Field>
          <Field label="Department" htmlFor="f-dept">
            <Input
              id="f-dept"
              list="dept-options"
              placeholder="e.g. Engineering"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
            />
            <datalist id="dept-options">
              {departments.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </Field>
          <Field label="Position" htmlFor="f-pos">
            <Input
              id="f-pos"
              placeholder="e.g. Software Developer"
              value={form.position}
              onChange={(e) => setForm({ ...form, position: e.target.value })}
            />
          </Field>
          <Field label="Phone" htmlFor="f-phone">
            <Input
              id="f-phone"
              type="tel"
              placeholder="+233 …"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </Field>
          {formError && (
            <p className="text-[13px] font-medium text-red-600 sm:col-span-2" role="alert">
              {formError}
            </p>
          )}
        </form>
      </Modal>

      {/* Success confirmation */}
      <Modal
        open={!!sentTo}
        onOpenChange={(o) => {
          if (!o) {
            setSentTo("");
            setSentLink(null);
          }
        }}
        title={sentLink ? "Invitation created" : "Invitation sent"}
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setSentTo("");
                setSentLink(null);
                setInviteOpen(true);
              }}
            >
              Invite another
            </Button>
            <Button
              onClick={() => {
                setSentTo("");
                setSentLink(null);
                router.push("/dashboard/staff");
              }}
            >
              Done
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-[14px] leading-relaxed text-neutral-600">
            <span className="font-semibold text-neutral-900">{sentName}</span> has been invited to join your
            organization. The invitation expires in 72 hours and can only be used once.
          </p>
          {sentLink ? <SetupLinkPanel link={sentLink} email={sentTo} /> : <SpamNotice email={sentTo} />}
        </div>
      </Modal>

      {/* Manual setup link when a resend email couldn't be delivered */}
      <Modal
        open={!!resendResult}
        onOpenChange={(o) => {
          if (!o) setResendResult(null);
        }}
        title="Share the setup link"
        size="sm"
        footer={
          <Button onClick={() => setResendResult(null)}>Done</Button>
        }
      >
        {resendResult && <SetupLinkPanel link={resendResult.link} email={resendResult.email} />}
      </Modal>

      <ConfirmDialog
        open={confirm.open}
        onOpenChange={(o) => setConfirm({ ...confirm, open: o })}
        loading={confirmBusy}
        destructive={confirm.next === "DISABLED"}
        title={confirm.next === "DISABLED" ? "Deactivate employee?" : "Reactivate employee?"}
        description={
          confirm.staff
            ? confirm.next === "DISABLED"
              ? `${confirm.staff.firstName} will no longer be able to clock in or view attendance. This does not delete their historical records.`
              : `${confirm.staff.firstName} will be able to sign in and clock in again.`
            : ""
        }
        confirmLabel={confirm.next === "DISABLED" ? "Deactivate" : "Reactivate"}
        onConfirm={toggle}
      />
    </div>
  );
}
