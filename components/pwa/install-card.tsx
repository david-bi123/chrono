"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Check, Download, Share, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function runningStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return window.matchMedia("(display-mode: standalone)").matches || iosStandalone;
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  // iPadOS 13+ reports a desktop Mac UA.
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

/**
 * "Install this website as an app" for staff who never think about app stores.
 * Android/desktop Chromium fire beforeinstallprompt, so the button works in one
 * tap. iOS Safari never fires it — there we show the Share sheet path instead.
 */
export function InstallCard() {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    setInstalled(runningStandalone());
    setIos(isIos());

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPrompt(null);
      setNote("ChronoSwift is installed. Open it from your home screen or app list.");
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!prompt) return;
    setBusy(true);
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === "accepted") {
        setInstalled(true);
        setNote("Installing. It will appear on your home screen in a moment.");
      } else {
        setNote("Install cancelled. You can add it later from your browser menu.");
      }
      setPrompt(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Install the app</CardTitle>
        <CardDescription>
          ChronoSwift installs from the browser — no app store, no download. It opens full screen, keeps your session
          and shows a branded page when you lose signal.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
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
              Works on Android, iPhone and desktop. Staff can scan the QR code straight from the installed app.
            </p>
          </div>
        </div>

        {installed ? (
          <div className="flex items-center gap-2 rounded-lg bg-brand-50 px-3.5 py-3 text-[13px] font-medium text-brand-700 ring-1 ring-inset ring-brand-100">
            <Check className="h-4 w-4 shrink-0" aria-hidden />
            Installed on this device
          </div>
        ) : prompt ? (
          <Button type="button" onClick={install} disabled={busy}>
            <Download className="h-4 w-4" aria-hidden />
            {busy ? "Opening installer…" : "Install ChronoSwift"}
          </Button>
        ) : ios ? (
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
        ) : (
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-[13px] font-semibold text-neutral-900">From your browser menu</p>
            <p className="mt-1 text-[13px] leading-relaxed text-neutral-600">
              Open the menu (⋮ or ⋯) and choose <span className="font-medium text-neutral-900">Install app</span> or{" "}
              <span className="font-medium text-neutral-900">Add to Home screen</span>. On desktop Chrome or Edge,
              look for the install icon in the address bar.
            </p>
          </div>
        )}

        {note ? <p className="text-[13px] text-neutral-600">{note}</p> : null}

        <p className="border-t border-neutral-100 pt-4 text-[12.5px] leading-relaxed text-neutral-500">
          Installing keeps the same login — there is nothing extra to set up. Attendance still needs a connection to
          record a clock-in.
        </p>
      </CardContent>
    </Card>
  );
}
