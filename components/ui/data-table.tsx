import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { TableSkeleton, EmptyState } from "@/components/ui/states";
import { Button } from "@/components/ui/button";

export type Column<T> = {
  key: string;
  header: React.ReactNode;
  render: (row: T) => React.ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
  /** Hide this column below the given breakpoint (keeps tables readable on mobile). */
  hideBelow?: "sm" | "md" | "lg" | "xl";
};

const HIDE: Record<string, string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
  xl: "hidden xl:table-cell",
};

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  empty,
  onRowClick,
  renderMobile,
  className,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  empty?: React.ReactNode;
  onRowClick?: (row: T) => void;
  /** Rendered as stacked cards below `md` — gives mobile a purposeful layout. */
  renderMobile?: (row: T) => React.ReactNode;
  className?: string;
}) {
  if (loading) return <TableSkeleton rows={5} />;
  if (rows.length === 0 && empty) return <>{empty}</>;

  return (
    <>
      {/* Desktop / tablet table */}
      <div className={cn("hidden w-full overflow-x-auto md:block", className)}>
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={cn(
                    c.align === "right" && "text-right",
                    c.align === "center" && "text-center",
                    c.hideBelow && HIDE[c.hideBelow]
                  )}
                  scope="col"
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(onRowClick && "cursor-pointer")}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn(
                      c.align === "right" && "text-right",
                      c.align === "center" && "text-center",
                      c.hideBelow && HIDE[c.hideBelow]
                    )}
                  >
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      {renderMobile && (
        <div className="flex flex-col gap-2.5 md:hidden">
          {rows.map((row) => (
            <div key={rowKey(row)}>{renderMobile(row)}</div>
          ))}
        </div>
      )}
      {!renderMobile && (
        <div className="flex flex-col gap-2.5 md:hidden">
          {rows.map((row) => (
            <div
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className="rounded-xl border border-neutral-200/80 bg-white p-3.5"
            >
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                {columns.map((c) => (
                  <div key={c.key}>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                      {typeof c.header === "string" ? c.header : c.key}
                    </dt>
                    <dd className="mt-0.5 text-[13.5px] text-neutral-800">{c.render(row)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export function TablePagination({
  page,
  pages,
  total,
  onPage,
  label = "records",
}: {
  page: number;
  pages: number;
  total: number;
  onPage: (p: number) => void;
  label?: string;
}) {
  if (pages <= 1) {
    return (
      <div className="flex items-center justify-between border-t border-neutral-100 px-5 py-3 text-[12.5px] text-neutral-500">
        <span>
          {total} {label}
        </span>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3 border-t border-neutral-100 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-[12.5px] text-neutral-500">
        Page {page} of {pages} · {total} {label}
      </span>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" /> Prev
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
          aria-label="Next page"
        >
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export { EmptyState };
