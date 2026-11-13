"use client";
import { useEffect, useState } from "react";

/**
 * Registers the service worker and surfaces app updates.
 *
 * Registration is production-only: a worker in `next dev` fights HMR and can
 * serve a stale shell over fresh code. The update bar waits for an explicit
 * reload instead of calling skipWaiting on install, so an open tab never swaps
 * JS chunks underneath itself.
 */
export function PwaProvider() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [reloading, setReloading] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    let cancelled = false;

    const watch = (reg: ServiceWorkerRegistration) => {
      if (reg.waiting && navigator.serviceWorker.controller) setWaiting(reg.waiting);
      reg.addEventListener("updatefound", () => {
        const installing = reg.installing;
        if (!installing) return;
        installing.addEventListener("statechange", () => {
          // controller === null means this is the first install, not an update.
          if (installing.state === "installed" && navigator.serviceWorker.controller) setWaiting(installing);
        });
      });
    };

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        if (!cancelled) watch(reg);
      })
      .catch(() => {
        // No worker (unsupported browser, blocked storage): the app still works.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!waiting) return;
    const onControllerChange = () => window.location.reload();
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    return () => navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
  }, [waiting]);

  if (!waiting) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center px-3 pb-3">
      <div
        role="status"
        className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3 shadow-lg"
      >
        <div className="min-w-0">
          <p className="text-[13.5px] font-semibold text-neutral-900">A new version is ready</p>
          <p className="text-[12.5px] text-neutral-500">Reload to get the latest fixes.</p>
        </div>
        <button
          type="button"
          disabled={reloading}
          onClick={() => {
            setReloading(true);
            waiting.postMessage("SKIP_WAITING");
          }}
          className="ml-auto inline-flex h-9 shrink-0 items-center justify-center rounded-lg bg-brand-600 px-3.5 text-[13px] font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
        >
          {reloading ? "Updating…" : "Reload"}
        </button>
      </div>
    </div>
  );
}
