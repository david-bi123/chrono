"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Building2, Ban, RotateCcw, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { PageHeader, FilterBar, SearchInput } from "@/components/ui/page-header";
import { DataTable, TablePagination, type Column } from "@/components/ui/data-table";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

interface Org {
  _id: string;
  name: string;
  email: string;
  status: string;
  staffCount: number;
  createdAt?: string;
}

export default function OrgsPage() {
  const { toast } = useToast();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [confirm, setConfirm] = useState<{ open: boolean; org?: Org; next: "ACTIVE" | "SUSPENDED" }>({
    open: false,
    next: "SUSPENDED",
  });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (q: string, p: number) => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch(`/api/super-admin/organizations?search=${encodeURIComponent(q)}&page=${p}`);
      if (!r.ok) throw new Error();
      const d = await r.json();
      setOrgs(d.orgs || []);
      setTotal(d.total || 0);
      setPages(Math.max(1, d.pages || 1));
    } catch {
      setError("We couldn't load organizations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(search, page);
  }, [page, load]); // eslint-disable-line react-hooks/exhaustive-deps

  function apply() {
    setPage(1);
    load(search, 1);
  }

  async function run() {
    if (!confirm.org) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/super-admin/organizations/${confirm.org._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: confirm.next }),
      });
      if (!r.ok) throw new Error();
      toast({
        title: confirm.next === "SUSPENDED" ? "Organization suspended" : "Organization activated",
        description: `${confirm.org.name} ${confirm.next === "SUSPENDED" ? "can no longer sign in." : "is active again."}`,
        variant: confirm.next === "SUSPENDED" ? "warning" : "success",
      });
      setConfirm({ open: false, next: "SUSPENDED" });
      load(search, page);
    } catch {
      toast({ title: "Unable to update organization", variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  const columns: Column<Org>[] = [
    {
      key: "org",
      header: "Organization",
      render: (o) => (
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <Building2 className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <div className="truncate font-medium text-neutral-900">{o.name}</div>
            <div className="truncate text-[11.5px] text-neutral-500">{o.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "staff",
      header: "Staff",
      align: "right",
      render: (o) => <span className="tabular text-neutral-700">{o.staffCount}</span>,
    },
    {
      key: "created",
      header: "Created",
      hideBelow: "md",
      render: (o) => (
        <span className="text-neutral-600">
          {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "—"}
        </span>
      ),
    },
    { key: "status", header: "Status", render: (o) => <StatusBadge value={o.status} size="sm" /> },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (o) => (
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            setConfirm({ open: true, org: o, next: o.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE" });
          }}
        >
          {o.status === "ACTIVE" ? (
            <>
              <Ban className="h-3.5 w-3.5" /> Suspend
            </>
          ) : (
            <>
              <RotateCcw className="h-3.5 w-3.5" /> Activate
            </>
          )}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Organizations"
        description="Provision, suspend and monitor every tenant on the platform."
        actions={
          <Link href="/super-admin/organizations/new">
            <Button>
              <Plus className="h-4 w-4" /> Create organization
            </Button>
          </Link>
        }
      />

      <FilterBar
        right={
          <span className="text-[12.5px] font-medium text-neutral-500 tabular">
            {loading ? "Loading…" : `${total} organization${total === 1 ? "" : "s"}`}
          </span>
        }
      >
        <SearchInput
          label="Search organizations"
          placeholder="Search by name or email…"
          value={search}
          onChange={setSearch}
          onKeyDown={(e) => e.key === "Enter" && apply()}
          className="sm:w-80"
        />
        <Button size="sm" variant="secondary" onClick={apply}>
          Search
        </Button>
      </FilterBar>

      <Card>
        <CardContent className="px-0 pb-0 pt-4 sm:px-0">
          {error ? (
            <div className="px-5 pb-5">
              <ErrorState message={error} onRetry={() => load(search, page)} />
            </div>
          ) : (
            <>
              <div className="px-5 sm:px-6">
                <DataTable
                  columns={columns}
                  rows={orgs}
                  rowKey={(o) => o._id}
                  loading={loading}
                  empty={
                    <EmptyState
                      icon={search ? SearchX : Building2}
                      title={search ? "No organizations match your search" : "No organizations yet"}
                      description={
                        search
                          ? "Try a different name or email address."
                          : "Create your first tenant to start onboarding administrators."
                      }
                      action={
                        <Link href="/super-admin/organizations/new">
                          <Button size="sm">
                            <Plus className="h-4 w-4" /> Create organization
                          </Button>
                        </Link>
                      }
                    />
                  }
                  renderMobile={(o) => (
                    <div className="rounded-xl border border-neutral-200/80 bg-white p-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                            <Building2 className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <div className="truncate text-[13.5px] font-semibold text-neutral-900">{o.name}</div>
                            <div className="truncate text-[11.5px] text-neutral-500">
                              {o.email} · {o.staffCount} staff
                            </div>
                          </div>
                        </div>
                        <StatusBadge value={o.status} size="sm" />
                      </div>
                      <div className="mt-3 flex justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setConfirm({ open: true, org: o, next: o.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE" })
                          }
                        >
                          {o.status === "ACTIVE" ? "Suspend" : "Activate"}
                        </Button>
                      </div>
                    </div>
                  )}
                />
              </div>
              {!loading && <TablePagination page={page} pages={pages} total={total} onPage={setPage} label="organizations" />}
            </>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirm.open}
        onOpenChange={(o) => setConfirm({ ...confirm, open: o })}
        loading={busy}
        destructive={confirm.next === "SUSPENDED"}
        title={confirm.next === "SUSPENDED" ? "Suspend organization?" : "Activate organization?"}
        description={
          confirm.org
            ? confirm.next === "SUSPENDED"
              ? `${confirm.org.name} and all of its administrators and staff will be blocked from signing in. Existing data is kept.`
              : `${confirm.org.name} will be able to sign in again immediately.`
            : ""
        }
        confirmLabel={confirm.next === "SUSPENDED" ? "Suspend" : "Activate"}
        onConfirm={run}
      />
    </div>
  );
}
