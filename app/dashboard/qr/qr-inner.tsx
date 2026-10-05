"use client";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Plus,
  QrCode,
  RefreshCw,
  Ban,
  Download,
  Printer,
  X,
  Copy,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Input, Field } from "@/components/ui/input";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { PageHeader, SectionHeader } from "@/components/ui/page-header";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { Modal, ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { LogoMark } from "@/components/brand/logo";

type Location = { _id: string; name: string; status: string; createdAt?: string };
type Fresh = { url: string; qrDataUrl: string; name: string };

export default function QrPage({ orgName }: { orgName: string }) {
  const { toast } = useToast();
  const [locs, setLocs] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [fresh, setFresh] = useState<Fresh | null>(null);
  const [confirm, setConfirm] = useState<{ open: boolean; loc?: Location; action: "rotate" | "revoke" }>({
    open: false,
    action: "rotate",
  });
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setError("");
    setLoading(true);
    fetch("/api/org/locations")
      .then(async (r) => {
        if (!r.ok) throw new Error();
        const d = await r.json();
        setLocs(d.locations || []);
      })
      .catch(() => setError("We couldn't load your QR locations."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setCreateError("");
    setCreating(true);
    try {
      const r = await fetch("/api/org/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const d = await r.json();
      if (!r.ok) {
        setCreateError(d.error || "We couldn't create this location.");
        return;
      }
      setFresh({ url: d.url, qrDataUrl: d.qrDataUrl, name });
      setCreateOpen(false);
      setName("");
      toast({ title: "Location created", description: "Your QR code is ready to download.", variant: "success" });
      load();
    } catch {
      setCreateError("Network error. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  async function runConfirm() {
    if (!confirm.loc) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/org/locations/${confirm.loc._id}?action=${confirm.action}`, { method: "POST" });
      const d = await r.json();
      if (!r.ok) throw new Error();
      if (confirm.action === "rotate") {
        setFresh({ url: d.url, qrDataUrl: d.qrDataUrl, name: confirm.loc.name });
        toast({
          title: "QR code regenerated",
          description: "Previous prints of this code no longer work.",
          variant: "warning",
        });
      } else {
        toast({ title: "QR code revoked", description: `${confirm.loc.name} can no longer be scanned.`, variant: "warning" });
      }
      setConfirm({ open: false, action: "rotate" });
      load();
    } catch {
      toast({ title: "Action failed", description: "Please try again.", variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="QR locations"
        description="Each location gets its own revocable QR code. Staff scan it with any camera to clock in or out."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> New location
          </Button>
        }
      />

      <div className="rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-3.5 text-[13px] leading-relaxed text-brand-800">
        <div className="flex gap-2.5">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
          <p>
            <span className="font-semibold">Codes are shown once.</span> Download or print a location&apos;s QR code
            straight after creating or regenerating it — ChronoSwift only stores a secure hash, so it can&apos;t re-show an
            existing code. Regenerating invalidates old prints immediately.
          </p>
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-neutral-200/80 bg-white p-5">
              <div className="skeleton h-4 w-32" />
              <div className="skeleton mt-3 h-5 w-20 rounded-full" />
              <div className="skeleton mt-5 h-8 w-full" />
            </div>
          ))}
        </div>
      ) : locs.length === 0 ? (
        <EmptyState
          icon={QrCode}
          title="No QR locations yet"
          description="Create your first location — reception, head office, warehouse — and print its QR code at the entrance."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> Create location
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {locs.map((l) => (
            <Card key={l._id} className="flex flex-col p-5 transition-colors hover:border-neutral-300">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg " +
                      (l.status === "ACTIVE" ? "bg-brand-50 text-brand-600" : "bg-neutral-100 text-neutral-500")
                    }
                  >
                    <QrCode className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-[15px] font-semibold tracking-[-0.01em] text-neutral-900">
                      {l.name}
                    </div>
                    <div className="text-[12.5px] text-neutral-500">
                      {l.createdAt
                        ? `Created ${new Date(l.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`
                        : "Location"}
                    </div>
                  </div>
                </div>
                <StatusBadge value={l.status} size="sm" />
              </div>

              <div className="mt-5 flex flex-wrap gap-2 border-t border-neutral-100 pt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirm({ open: true, loc: l, action: "rotate" })}
                  disabled={l.status === "REVOKED"}
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Regenerate
                </Button>
                {l.status === "ACTIVE" ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => setConfirm({ open: true, loc: l, action: "revoke" })}
                  >
                    <Ban className="h-3.5 w-3.5" /> Revoke
                  </Button>
                ) : (
                  <span className="inline-flex items-center px-2 text-[12.5px] text-neutral-500">
                    Revoked — regenerate to restore
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal
        open={createOpen}
        onOpenChange={(o) => {
          if (!creating) {
            setCreateOpen(o);
            if (!o) setCreateError("");
          }
        }}
        title="New QR location"
        description="Give the entrance or area a clear name — it appears on the printed sheet."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <Button type="submit" form="loc-form" loading={creating}>
              Generate QR
            </Button>
          </>
        }
      >
        <form id="loc-form" onSubmit={create}>
          <Field
            label="Location name"
            htmlFor="loc-name"
            required
            error={createError}
            hint="For example: Main Office, Reception, Warehouse."
          >
            <Input
              id="loc-name"
              required
              maxLength={100}
              placeholder="Main Office"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirm.open}
        onOpenChange={(o) => setConfirm({ ...confirm, open: o })}
        loading={busy}
        destructive
        title={confirm.action === "rotate" ? "Regenerate this QR code?" : "Revoke this QR code?"}
        description={
          confirm.action === "rotate"
            ? `A new code will be created for ${confirm.loc?.name}. Every printed copy of the current code stops working immediately.`
            : `${confirm.loc?.name} will stop accepting scans. Staff will see an unavailable message until you regenerate the code.`
        }
        confirmLabel={confirm.action === "rotate" ? "Regenerate" : "Revoke"}
        onConfirm={runConfirm}
      />

      {fresh && <QrPanel orgName={orgName} location={fresh} onClose={() => setFresh(null)} />}
    </div>
  );
}

function QrPanel({
  orgName,
  location,
  onClose,
}: {
  orgName: string;
  location: Fresh;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  // The QR embeds this URL verbatim. If APP_URL wasn't configured server-side
  // the link is relative and no phone will be able to open it — say so loudly.
  const absolute = location.url.startsWith("http://") || location.url.startsWith("https://");

  function doPrint() {
    document.body.classList.add("chrono-printing");
    const cleanup = () => document.body.classList.remove("chrono-printing");
    window.addEventListener("afterprint", cleanup, { once: true });
    window.print();
    window.setTimeout(cleanup, 400);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(location.url);
      setCopied(true);
      toast({ title: "Link copied", variant: "success" });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Couldn't copy link", variant: "error" });
    }
  }

  return createPortal(
    <div className="chrono-print-portal fixed inset-0 z-[70] overflow-auto bg-neutral-100">
      <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-4 p-4 sm:p-8">
        {/* Controls — hidden on paper */}
        <div className="no-print flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[13px] font-medium text-neutral-600">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            QR ready — download or print it now
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              <X className="h-4 w-4" /> Close
            </Button>
            <Button onClick={doPrint}>
              <Printer className="h-4 w-4" /> Print
            </Button>
          </div>
        </div>

        {/* The printable sheet */}
        {!absolute && (
          <div
            role="alert"
            className="no-print mx-auto flex w-full max-w-[520px] items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-[13px] leading-relaxed text-amber-800"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              This link is relative because <code className="font-mono font-semibold">APP_URL</code> isn&apos;t set on
              the server — phones scanning this QR won&apos;t reach it. Set the public address, restart, then
              regenerate the code.
            </span>
          </div>
        )}
        <div className="print-sheet mx-auto w-full max-w-[520px] rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-lift sm:p-10">
          <div className="flex flex-col items-center">
            <LogoMark className="h-11 w-11" />
            <div className="mt-3 text-[17px] font-semibold tracking-[-0.02em]">ChronoSwift</div>
            <div className="mt-0.5 text-[13px] text-neutral-500">{orgName}</div>
          </div>

          <div className="mt-7 border-t border-neutral-100 pt-7">
            <div className="text-[13px] font-semibold uppercase tracking-[0.14em] text-neutral-500">Scan at</div>
            <div className="mt-1.5 text-2xl font-semibold tracking-[-0.02em] text-neutral-900">{location.name}</div>
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={location.qrDataUrl}
            alt={`QR code for ${location.name}`}
            className="mx-auto mt-7 h-64 w-64 rounded-xl border border-neutral-200 p-2"
          />

          <div className="mt-7 text-[15px] font-semibold text-neutral-900">Scan to record your attendance</div>
          <p className="mx-auto mt-1.5 max-w-xs text-[13px] leading-relaxed text-neutral-500">
            Open your phone camera, point it at the code, then tap Clock In.
          </p>

          <div className="mt-7 break-all rounded-lg bg-neutral-50 px-3 py-2.5 font-mono text-[11px] text-neutral-500">
            {location.url}
          </div>
        </div>

        {/* Actions — hidden on paper */}
        <div className="no-print flex flex-wrap items-center justify-center gap-2.5">
          <ButtonLink
            href={location.qrDataUrl}
            download={`chronoswift-${location.name.toLowerCase().replace(/\s+/g, "-")}.png`}
            variant="secondary"
          >
            <Download className="h-4 w-4" /> Download PNG
          </ButtonLink>
          <Button variant="secondary" onClick={copy}>
            {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />} Copy link
          </Button>
          <Button onClick={doPrint}>
            <Printer className="h-4 w-4" /> Print sheet
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
