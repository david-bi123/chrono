"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";

interface Org {
  _id: string;
  name: string;
  email: string;
  status: string;
  staffCount: number;
  createdAt: string;
}

export default function OrgsPage() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  async function load(q = "") {
    setLoading(true);
    const res = await fetch(`/api/super-admin/organizations?search=${encodeURIComponent(q)}`);
    const d = await res.json();
    setOrgs(d.orgs || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleStatus(o: Org) {
    const next = o.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    if (!confirm(`${next === "SUSPENDED" ? "Suspend" : "Activate"} ${o.name}?`)) return;
    await fetch(`/api/super-admin/organizations/${o._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    load(search);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-2">
          <Input placeholder="Search organizations…" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") load(search); }} />
          <Button variant="secondary" onClick={() => load(search)}>Search</Button>
        </div>
        <Link href="/super-admin/organizations/new" className="rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white text-center">Create organization</Link>
      </div>
      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-16 w-full" />)}</div>
      ) : orgs.length === 0 ? (
        <EmptyState title="No organizations yet" description="Create your first tenant to start onboarding staff." action={<Link href="/super-admin/organizations/new" className="rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white">Create organization</Link>} />
      ) : (
        <div className="grid gap-3">
          {orgs.map((o) => (
            <Card key={o._id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <div className="text-sm font-semibold">{o.name}</div>
                  <div className="text-xs text-neutral-500">{o.email} · {o.staffCount} staff</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge value={o.status} />
                  <Button size="sm" variant="outline" onClick={() => toggleStatus(o)}>
                    {o.status === "ACTIVE" ? "Suspend" : "Activate"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
