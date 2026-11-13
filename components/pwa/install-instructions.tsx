"use client";
import { Share, Smartphone } from "lucide-react";

export function detectIos(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  // iPadOS 13+ reports a desktop Mac UA.
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function isRunningStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return window.matchMedia("(display-mode: standalone)").matches || iosStandalone;
}

/**
 * Platform-specific "add this site to your device" steps. Used by the settings
 * card and the install dialog, because neither iOS nor Firefox exposes the
 * beforeinstallprompt event — the only honest answer there is instructions.
 */
export function InstallInstructions({ ios }: { ios: boolean }) {
  if (ios) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
        <p className="flex items-center gap-2 text-[13px] font-semibold text-neutral-900">
          <Smartphone className="h-4 w-4 text-brand-600" aria-hidden />
          On iPhone or iPad
        </p>
        <ol className="mt-2 space-y-1.5 pl-5 text-[13px] leading-relaxed text-neutral-600">
          <li className="list-decimal">
            Open this site in <span className="font-medium text-neutral-900">Safari</span>.
          </li>
          <li className="list-decimal">
            Tap <Share className="inline h-3.5 w-3.5 align-[-2px]" aria-label="Share" /> Share, then{" "}
            <span className="font-medium text-neutral-900">Add to Home Screen</span>.
          </li>
          <li className="list-decimal">Tap Add — ChronoSwift appears with your other apps.</li>
        </ol>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
      <p className="text-[13px] font-semibold text-neutral-900">From your browser menu</p>
      <p className="mt-1 text-[13px] leading-relaxed text-neutral-600">
        Open the menu (⋮ or ⋯) and choose <span className="font-medium text-neutral-900">Install app</span> or{" "}
        <span className="font-medium text-neutral-900">Add to Home screen</span>. On desktop Chrome or Edge, look for
        the install icon in the address bar.
      </p>
    </div>
  );
}
