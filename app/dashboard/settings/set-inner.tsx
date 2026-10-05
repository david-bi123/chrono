"use client";
import { useEffect, useState } from "react";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  const [org, setOrg] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", industry: "", timezone: "Africa/Accra", workStart: "08:00", workEnd: "17:00", graceMinutes: 15 });
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/org/settings").then((r) => r.json()).then((d) => {
      if (d.org) {
        setOrg(d.org);
        const a = (d.org.attendanceSettings || {}) as Record<string, unknown>;
        setForm({
          name: String(d.org.name || ""),
          email: String(d.org.email || ""),
          phone: String(d.org.phone || ""),
          address: String(d.org.address || ""),
          industry: String(d.org.industry || ""),
          timezone: String(d.org.timezone || "Africa/Accra"),
          workStart: String(a.workStart || "08:00"),
          workEnd: String(a.workEnd || "17:00"),
          graceMinutes: Number(a.graceMinutes ?? 15),
        });
      }
    }).catch(() => {});
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const r = await fetch("/api/org/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        org: { name: form.name, email: form.email, phone: form.phone, address: form.address, industry: form.industry, timezone: form.timezone },
        attendance: { workStart: form.workStart, workEnd: form.workEnd, graceMinutes: Number(form.graceMinutes), timezone: form.timezone },
      }),
    });
    setMsg(r.ok ? "Saved" : "Failed to save");
  }

  if (!org) return <div className="skeleton h-64" />;
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <form onSubmit={save} className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Organization</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div><Label>Name</Label><Input value={form.name} onChange={set("name")} required /></div>
          <div><Label>Email</Label><Input value={form.email} onChange={set("email")} required /></div>
          <div><Label>Phone</Label><Input value={form.phone} onChange={set("phone")} /></div>
          <div><Label>Industry</Label><Input value={form.industry} onChange={set("industry")} /></div>
          <div className="md:col-span-2"><Label>Address</Label><Input value={form.address} onChange={set("address")} /></div>
          <div><Label>Timezone</Label><Input value={form.timezone} onChange={set("timezone")} placeholder="Africa/Accra" /></div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Attendance rules</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div><Label>Work start (HH:MM)</Label><Input value={form.workStart} onChange={set("workStart")} pattern="\d{2}:\d{2}" required /></div>
          <div><Label>Work end (HH:MM)</Label><Input value={form.workEnd} onChange={set("workEnd")} pattern="\d{2}:\d{2}" required /></div>
          <div><Label>Grace minutes</Label><Input type="number" min={0} max={120} value={form.graceMinutes} onChange={set("graceMinutes")} /></div>
        </CardContent>
      </Card>
      <div className="flex items-center gap-3">
        <Button type="submit">Save settings</Button>
        {msg && <span className="text-sm text-neutral-500">{msg}</span>}
      </div>
    </form>
  );
}
