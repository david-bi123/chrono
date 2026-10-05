"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { Label } from "@/components/ui/input";
import { SpamNotice } from "@/components/ui/spam-notice";

interface Staff {
  _id: string; firstName: string; lastName: string; email: string; employeeId?: string;
  department?: string; position?: string; status: string;
}

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", employeeId: "", department: "", position: "", phone: "" });
  const [err, setErr] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeEmail, setNoticeEmail] = useState("");

  async function load() {
    setLoading(true);
    const r = await fetch(`/api/org/staff?search=${encodeURIComponent(search)}`);
    const d = await r.json();
    setStaff(d.staff || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setNotice("");
    const r = await fetch("/api/org/staff", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const d = await r.json();
    if (!r.ok) {
      setErr(d.error || "Failed");
      return;
    }
    const sentTo = form.email;
    setShowInvite(false);
    setForm({ firstName: "", lastName: "", email: "", employeeId: "", department: "", position: "", phone: "" });
    setNoticeEmail(sentTo);
    setNotice(`Invitation sent.`);
    load();
  }

  async function toggle(s: Staff) {
    const next = s.status === "DISABLED" ? "ACTIVE" : "DISABLED";
    if (!confirm(`${next === "DISABLED" ? "Disable" : "Reactivate"} ${s.firstName} ${s.lastName}?`)) return;
    await fetch(`/api/org/staff/${s._id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }) });
    load();
  }

  async function resend(s: Staff) {
    const r = await fetch(`/api/org/staff/${s._id}/resend`, { method: "POST" });
    if (r.ok) {
      setNoticeEmail(s.email);
      setNotice("Invitation resent.");
    } else {
      setNoticeEmail("");
      setNotice("");
      setErr("Resend failed. Try again.");
    }
  }

  return (
    <div className="space-y-4">
      {notice && <SpamNotice email={noticeEmail} />}
      <div className="flex flex-col gap-2 md:flex-row md:justify-between">
        <div className="flex gap-2">
          <Input placeholder="Search name, email, ID…" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} />
          <Button variant="secondary" onClick={load}>Search</Button>
        </div>
        <Button onClick={() => setShowInvite(!showInvite)}>Invite Staff</Button>
      </div>

      {showInvite && (
        <Card>
          <CardHeader><CardTitle>Invite staff</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={invite} className="grid gap-3 md:grid-cols-2">
              <div><Label>First name *</Label><Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required /></div>
              <div><Label>Last name *</Label><Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required /></div>
              <div><Label>Email *</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
              <div><Label>Employee ID *</Label><Input value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} required /></div>
              <div><Label>Department</Label><Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></div>
              <div><Label>Position</Label><Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} /></div>
              {err && <p className="text-xs text-red-600 md:col-span-2">{err}</p>}
              <div className="md:col-span-2"><Button type="submit">Send invitation</Button></div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? <div className="skeleton h-40" /> : staff.length === 0 ? (
        <EmptyState title="No staff members yet" description="Invite your first staff member to start tracking attendance." action={<Button onClick={() => setShowInvite(true)}>Invite Staff</Button>} />
      ) : (
        <div className="grid gap-2">
          {staff.map((s) => (
            <Card key={s._id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-2 p-4">
                <div>
                  <div className="text-sm font-semibold">{s.firstName} {s.lastName} <span className="ml-2"><Badge value={s.status} /></span></div>
                  <div className="text-xs text-neutral-500">{s.email} · {s.employeeId} {s.department ? `· ${s.department}` : ""}</div>
                </div>
                <div className="flex gap-2">
                  {s.status === "PENDING" && <Button size="sm" variant="outline" onClick={() => resend(s)}>Resend invite</Button>}
                  <Button size="sm" variant="outline" onClick={() => toggle(s)}>{s.status === "DISABLED" ? "Reactivate" : "Disable"}</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
