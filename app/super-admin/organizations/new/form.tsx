"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SpamNotice } from "@/components/ui/spam-notice";

export default function NewOrgForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "", email: "", phone: "", address: "", industry: "",
    adminFirstName: "", adminLastName: "", adminEmail: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdEmail, setCreatedEmail] = useState("");
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/super-admin/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, status: "ACTIVE" }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error || "Failed to create");
        return;
      }
      setCreatedEmail(form.adminEmail);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (createdEmail) {
    return (
      <Card className="max-w-2xl">
        <CardHeader><CardTitle>Organization created</CardTitle><CardDescription>Admin invitation sent.</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          <SpamNotice email={createdEmail} />
          <p className="text-sm text-neutral-500">The setup link expires in 72 hours and is single-use.</p>
          <Link href="/super-admin/organizations" className="inline-block rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white">Back to organizations</Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader><CardTitle>Create organization</CardTitle><CardDescription>Provisions tenant + admin invitation email (72h, single-use).</CardDescription></CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          <div><Label>Organization name *</Label><Input value={form.name} onChange={set("name")} required /></div>
          <div><Label>Organization email *</Label><Input type="email" value={form.email} onChange={set("email")} required /></div>
          <div><Label>Phone</Label><Input value={form.phone} onChange={set("phone")} /></div>
          <div><Label>Industry</Label><Input value={form.industry} onChange={set("industry")} placeholder="e.g. Technology" /></div>
          <div className="md:col-span-2"><Label>Address</Label><Input value={form.address} onChange={set("address")} /></div>
          <div><Label>Admin first name *</Label><Input value={form.adminFirstName} onChange={set("adminFirstName")} required /></div>
          <div><Label>Admin last name *</Label><Input value={form.adminLastName} onChange={set("adminLastName")} required /></div>
          <div className="md:col-span-2"><Label>Admin email *</Label><Input type="email" value={form.adminEmail} onChange={set("adminEmail")} required /></div>
          <div className="md:col-span-2"><FieldError message={error} /><Button disabled={loading} className="w-full md:w-auto">{loading ? "Creating…" : "Create organization"}</Button></div>
        </form>
      </CardContent>
    </Card>
  );
}
