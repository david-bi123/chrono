"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input, Field, FormAlert } from "@/components/ui/input";
import { Button, LinkButton } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SpamNotice, SetupLinkPanel } from "@/components/ui/spam-notice";
import { CheckCircle2, ArrowLeft, Building2, Mail, CreditCard, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type PlanId = "STARTER" | "GROWTH" | "BUSINESS";

const PLANS: Array<{
  id: PlanId;
  name: string;
  priceGhs: number;
  staff: string;
  managers: string;
  branches: string;
  history: string;
}> = [
  { id: "STARTER", name: "Starter", priceGhs: 500, staff: "30 staff", managers: "2 managers", branches: "1 branch", history: "6 months history" },
  { id: "GROWTH", name: "Growth", priceGhs: 750, staff: "70 staff", managers: "5 managers", branches: "3 branches", history: "12 months history" },
  { id: "BUSINESS", name: "Business", priceGhs: 1000, staff: "Unlimited staff", managers: "Unlimited managers", branches: "Unlimited branches", history: "Unlimited history" },
];

const ghs = (n: number) => `GH₵${n.toLocaleString("en-GH")}`;

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
  const [plan, setPlan] = useState<PlanId>("STARTER");
  const [billingExempt, setBillingExempt] = useState(false);
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
        body: JSON.stringify({ ...form, status: "ACTIVE", plan, billingExempt }),
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
                  setPlan("STARTER");
                  setBillingExempt(false);
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
            <Field label="Organization email (optional)" htmlFor="o-email">
              <Input id="o-email" type="email" value={form.email} onChange={set("email")} placeholder="hello@company.com" />
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
              <CreditCard className="h-4 w-4 text-neutral-500" /> Subscription plan
            </div>
            <p className="mt-1 text-sm text-neutral-500">
              The organisation gets this plan&apos;s limits immediately. You can change it later from the
              organizations list.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {PLANS.map((p) => {
                const active = plan === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlan(p.id)}
                    aria-pressed={active}
                    className={cn(
                      "relative rounded-xl border p-4 text-left transition",
                      active
                        ? "border-brand-500 bg-brand-50/60 ring-1 ring-brand-500/30"
                        : "border-neutral-200 hover:border-neutral-300"
                    )}
                  >
                    {active && (
                      <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                    <div className="text-[14px] font-semibold text-neutral-900">{p.name}</div>
                    <div className="mt-0.5 text-[15px] font-semibold tabular text-neutral-900">
                      {ghs(p.priceGhs)}
                      <span className="text-[11.5px] font-normal text-neutral-500">/mo</span>
                    </div>
                    <ul className="mt-2.5 space-y-1 text-[12px] text-neutral-600">
                      <li>{p.staff}</li>
                      <li>{p.managers}</li>
                      <li>{p.branches}</li>
                      <li>{p.history}</li>
                    </ul>
                  </button>
                );
              })}
            </div>

            <label className="mt-4 flex items-start gap-2.5 rounded-xl border border-neutral-200/80 p-3.5">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-600"
                checked={billingExempt}
                onChange={(e) => setBillingExempt(e.target.checked)}
              />
              <span className="text-[13px] leading-relaxed text-neutral-600">
                <span className="font-semibold text-neutral-900">Billing exempt.</span>{" "}
                Internal or test workspace — assign the plan without charging through Paystack.
              </span>
            </label>
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

          <p className="text-[13px] leading-relaxed text-neutral-500">
            By creating this organization you confirm you have the authority to do so, agree that its
            administrator will invite staff whose attendance ChronoSwift records, and accept our{" "}
            <Link href="/terms" target="_blank" className="font-medium text-brand-700 underline-offset-2 hover:underline">Terms of Service</Link>{" "}
            and{" "}
            <Link href="/privacy" target="_blank" className="font-medium text-brand-700 underline-offset-2 hover:underline">Privacy Policy</Link>.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
