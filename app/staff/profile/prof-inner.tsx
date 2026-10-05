"use client";
import { useEffect, useState } from "react";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProfilePage() {
  const [p, setP] = useState({ firstName: "", lastName: "", email: "", phone: "", employeeId: "", department: "", position: "" });
  const [pw, setPw] = useState({ current: "", next: "" });
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/staff/profile").then((r) => r.json()).then((d) => {
      if (d.profile) setP({
        firstName: d.profile.firstName || "", lastName: d.profile.lastName || "", email: d.profile.email || "",
        phone: d.profile.phone || "", employeeId: d.profile.employeeId || "",
        department: d.profile.department || "", position: d.profile.position || "",
      });
    }).catch(() => {});
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/staff/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ firstName: p.firstName, lastName: p.lastName, phone: p.phone }) });
    setMsg(r.ok ? "Profile saved" : "Failed");
  }

  async function changePw(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/staff/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: pw.current, newPassword: pw.next }) });
    const d = await r.json();
    setMsg(r.ok ? "Password changed" : (d.error || "Failed"));
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={save} className="grid gap-3 md:grid-cols-2">
            <div><Label>First name</Label><Input value={p.firstName} onChange={(e) => setP({ ...p, firstName: e.target.value })} /></div>
            <div><Label>Last name</Label><Input value={p.lastName} onChange={(e) => setP({ ...p, lastName: e.target.value })} /></div>
            <div><Label>Email</Label><Input value={p.email} disabled /></div>
            <div><Label>Phone</Label><Input value={p.phone} onChange={(e) => setP({ ...p, phone: e.target.value })} /></div>
            <div><Label>Employee ID</Label><Input value={p.employeeId} disabled /></div>
            <div><Label>Department</Label><Input value={p.department} disabled /></div>
            <div className="md:col-span-2"><Button type="submit">Save</Button></div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Change password</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={changePw} className="grid gap-3 md:grid-cols-2">
            <div><Label>Current password</Label><Input type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></div>
            <div><Label>New password</Label><Input type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></div>
            <div className="md:col-span-2"><Button type="submit" variant="secondary">Change password</Button> {msg && <span className="ml-2 text-sm text-neutral-500">{msg}</span>}</div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
