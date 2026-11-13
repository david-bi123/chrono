"use client";
import { useState } from "react";
import { Download, Smartphone } from "lucide-react";
import Image from "next/image";
import { Modal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { InstallInstructions } from "@/components/pwa/install-instructions";
import { useInstallPrompt } from "@/components/pwa/use-install-prompt";

type Variant = "solid" | "outline" | "ghost" | "menu";

const STYLES: Record<Variant, string> = {
  solid:
    "rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 active:scale-[0.98]",
  outline:
    "rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 shadow-xs transition hover:border-brand-300 hover:text-brand-700 active:scale-[0.98]",
  ghost: "rounded-lg px-3 py-2 text-[13.5px] font-medium text-neutral-600 transition hover:text-neutral-900",
  menu: "flex w-full items-center justify-start gap-2.5 py-3.5 text-[15px] font-medium text-neutral-700 transition hover:text-brand-700",
};

/**
 * Always-visible install button.
 *
 * Chromium gives us beforeinstallprompt, so one tap installs. iOS Safari and
 * Firefox never fire it, so the same button opens the how-to dialog instead of
 * disappearing — a button that does nothing is worse than a button that
 * explains the two taps.
 */
export function InstallAppButton({
  label = "Install app",
  variant = "solid",
  iconOnly = false,
  className,
  onAction,
}: {
  label?: string;
  variant?: Variant;
  iconOnly?: boolean;
  className?: string;
  onAction?: () => void;
}) {
  const { prompt, installed, ios, install } = useInstallPrompt();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  // Nothing to offer on a device that already runs the installed app.
  if (installed) return null;

  async function start() {
    onAction?.();
    if (!prompt) {
      setOpen(true);
      return;
    }
    setBusy(true);
    try {
      const outcome = await install();
      if (outcome === "unavailable") setOpen(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void start()}
        disabled={busy}
        aria-label={iconOnly ? label : undefined}
        title={iconOnly ? label : undefined}
        className={cn(
          "inline-flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:opacity-60",
          STYLES[variant],
          iconOnly && "h-9 w-9 p-0",
          className
        )}
      >
        <Download className="h-4 w-4" aria-hidden />
        {!iconOnly && <span>{busy ? "Opening…" : label}</span>}
      </button>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Install ChronoSwift"
        description="Add it to your home screen or desktop — no app store needed."
      >
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <Image
              src="/icons/icon-192.png"
              alt="ChronoSwift app icon"
              width={56}
              height={56}
              className="h-14 w-14 shrink-0 rounded-xl ring-1 ring-neutral-200"
            />
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-neutral-900">ChronoSwift</p>
              <p className="text-[13px] leading-relaxed text-neutral-500">
                Opens full screen with your session intact. Attendance still needs a connection to record.
              </p>
            </div>
          </div>

          <InstallInstructions ios={ios} />

          {ios ? (
            <p className="flex items-start gap-2 text-[12.5px] leading-relaxed text-neutral-500">
              <Smartphone className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              iPhone and iPad only install from Safari. Chrome on iOS opens the page but cannot add it to the home
              screen.
            </p>
          ) : null}

          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
