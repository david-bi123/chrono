"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Field, FormAlert } from "@/components/ui/input";
import { Button, LinkButton } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SpamNotice, SetupLinkPanel } from "@/components/ui/spam-notice";
import { CheckCircle2, ArrowLeft, Building2, Mail } from "lucide-react";

export default function NewOrgForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    industry: "",
    adminFirstName: "",
    adminLastName: "",
    adminEmail: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<{
    email: string;
    name: string;
    emailSent: boolean;
    setupLink?: string;
  } | null>(null);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

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
        setError(d.error || "Failed to create organization");
        return;
      }
      setCreated({
        email: form.adminEmail,
        name: form.name,
        emailSent: d.emailSent !== false,
        setupLink: d.setupLink,
      });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (created) {
    return (
      <Card className="max-w-2xl">
        <CardContent className="py-8">
          <div className="flex flex-col items-center text-center">
            <div className="check-pop flex h-14 w-14 items-center justify-center rounded-full bg-brand-100">
              <CheckCircle2 className="h-7 w-7 text-brand-600" />
            </div>
            <h2 className="font-display mt-4 text-xl font-bold tracking-[-0.02em] text-neutral-900">Organization created</h2>
            <p className="mt-1.5 max-w-md text-[14px] leading-relaxed text-neutral-500">
              <span className="font-semibold text-neutral-800">{created.name}</span> is ready.{" "}
              {created.emailSent ? (
                <>
                  An invitation to set up the administrator account was sent to{" "}
                  <span className="font-medium text-neutral-800">{created.email}</span>.
                </>
              ) : (
                <>
                  The administrator account for{" "}
                  <span className="font-medium text-neutral-800">{created.email}</span> is ready — share the setup
                  link below manually.
                </>
              )}
            </p>
            <div className="mt-5 w-full max-w-md text-left">
              {created.emailSent || !created.setupLink ? (
                <SpamNotice email={created.email} />
              ) : (
                <SetupLinkPanel link={created.setupLink} email={created.email} />
              )}
            </div>
            <p className="mt-4 text-[12.5px] text-neutral-500">
              The setup link expires in 72 hours and can only be used once.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2.5">
              <LinkButton href="/super-admin/organizations" variant="secondary">
                <ArrowLeft className="h-4 w-4" /> Back to organizations
              </LinkButton>
              <Button
                onClick={() => {
                  setCreated(null);
                  setForm({
                    name: "",
                    email: "",
                    phone: "",
                    address: "",
                    industry: "",
                    adminFirstName: "",
                    adminLastName: "",
                    adminEmail: "",
                  });
                }}
              >
                <Building2 className="h-4 w-4" /> Create another
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>Organization details</CardTitle>
        <CardDescription>Everything here can be edited later by the administrator.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-6">
          <FormAlert message={error} />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Organization name" htmlFor="o-name" required className="md:col-span-2">
              <Input id="o-name" required minLength={2} value={form.name} onChange={set("name")} placeholder="Acme Technologies" />
            </Field>
            <Field label="Organization email" htmlFor="o-email" required>
              <Input id="o-email" type="email" required value={form.email} onChange={set("email")} placeholder="hello@company.com" />
            </Field>
            <Field label="Phone" htmlFor="o-phone">
              <Input id="o-phone" type="tel" value={form.phone} onChange={set("phone")} placeholder="+233 …" />
            </Field>
            <Field label="Industry" htmlFor="o-industry">
              <Input id="o-industry" value={form.industry} onChange={set("industry")} placeholder="e.g. Technology" />
            </Field>
            <Field label="Address" htmlFor="o-address">
              <Input id="o-address" value={form.address} onChange={set("address")} placeholder="City, Country" />
            </Field>
          </div>

          <div className="border-t border-neutral-100 pt-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
              <Mail className="h-4 w-4 text-neutral-500" /> Administrator
            </div>
            <p className="mt-1 text-sm text-neutral-500">
              They&apos;ll receive a secure setup link and choose their own password.
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="First name" htmlFor="a-first" required>
                <Input id="a-first" required value={form.adminFirstName} onChange={set("adminFirstName")} />
              </Field>
              <Field label="Last name" htmlFor="a-last" required>
                <Input id="a-last" required value={form.adminLastName} onChange={set("adminLastName")} />
              </Field>
              <Field label="Work email" htmlFor="a-email" required className="md:col-span-2">
                <Input id="a-email" type="email" required value={form.adminEmail} onChange={set("adminEmail")} />
              </Field>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Button type="submit" loading={loading}>
              <Building2 className="h-4 w-4" /> {loading ? "Creating…" : "Create organization"}
            </Button>
            <LinkButton href="/super-admin/organizations" variant="secondary">
              Cancel
            </LinkButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
