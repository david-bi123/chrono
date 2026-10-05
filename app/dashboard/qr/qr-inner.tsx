"use client";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function QrPage() {
  const [locs, setLocs] = useState<Array<{ _id: string; name: string; status: string }>>([]);
  const [name, setName] = useState("");
  const [created, setCreated] = useState<{ url: string; qrDataUrl: string } | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const r = await fetch("/api/org/locations");
    const d = await r.json();
    setLocs(d.locations || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/org/locations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    const d = await r.json();
    if (r.ok) {
      setCreated({ url: d.url, qrDataUrl: d.qrDataUrl });
      setName("");
      load();
    }
  }

  async function rotate(id: string) {
    if (!confirm("Regenerate this QR? The old printed code will stop working.")) return;
    const r = await fetch(`/api/org/locations/${id}?action=rotate`, { method: "POST" });
    const d = await r.json();
    if (r.ok) setCreated({ url: d.url, qrDataUrl: d.qrDataUrl });
  }

  async function revoke(id: string) {
    if (!confirm("Revoke this QR?")) return;
    await fetch(`/api/org/locations/${id}?action=revoke`, { method: "POST" });
    load();
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Create attendance location</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={create} className="flex gap-2">
            <Input placeholder="e.g. Main Office, Reception…" value={name} onChange={(e) => setName(e.target.value)} required />
            <Button type="submit">Generate QR</Button>
          </form>
          <p className="mt-2 text-xs text-neutral-500">Each location gets its own cryptographically-random, revocable QR. The raw code is shown once — download/print it now. Rotate any time to invalidate old prints.</p>
        </CardContent>
      </Card>

      {created && (
        <Card>
          <CardHeader><CardTitle>New QR code — save it now</CardTitle></CardHeader>
          <CardContent className="flex flex-col items-start gap-3 md:flex-row">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={created.qrDataUrl} alt="Attendance QR" className="h-56 w-56 rounded-lg border" />
            <div className="text-sm">
              <div className="break-all rounded bg-neutral-50 p-2 font-mono text-xs">{created.url}</div>
              <div className="mt-3 flex gap-2">
                <a href={created.qrDataUrl} download="chronoswift-qr.png" className="rounded-lg bg-neutral-900 px-4 py-2 text-white">Download PNG</a>
                <button onClick={() => window.print()} className="rounded-lg border px-4 py-2">Print</button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Locations</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="skeleton h-24" /> : locs.length === 0 ? <p className="text-sm text-neutral-500">No locations yet.</p> : (
            <div className="space-y-2">
              {locs.map((l) => (
                <div key={l._id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="text-sm font-medium">{l.name} <span className="ml-2"><Badge value={l.status} /></span></div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => rotate(l._id)}>Regenerate</Button>
                    {l.status === "ACTIVE" && <Button size="sm" variant="outline" onClick={() => revoke(l._id)}>Revoke</Button>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
