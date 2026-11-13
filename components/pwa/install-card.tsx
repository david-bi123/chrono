"use client";
import Image from "next/image";
import { Check, Download } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InstallInstructions } from "@/components/pwa/install-instructions";
import { useInstallPrompt } from "@/components/pwa/use-install-prompt";

/**
 * Settings → App. Shows the one-tap button where the browser supports it and
 * the manual steps everywhere else, so nobody hits a dead end on iOS.
 */
export function InstallCard() {
  const { prompt, installed, ios, install } = useInstallPrompt();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  async function start() {
    if (!prompt) return;
    setBusy(true);
    try {
      const outcome = await install();
      setNote(
        outcome === "accepted"
          ? "Installing. It will appear on your home screen in a moment."
          : "Install cancelled. You can add it later from your browser menu."
      );
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
          <Button type="button" onClick={start} disabled={busy}>
            <Download className="h-4 w-4" aria-hidden />
            {busy ? "Opening installer…" : "Install ChronoSwift"}
          </Button>
        ) : (
          <InstallInstructions ios={ios} />
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
