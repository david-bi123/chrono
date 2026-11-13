"use client";
import { useCallback, useEffect, useState } from "react";
import { detectIos, isRunningStandalone } from "@/components/pwa/install-instructions";

export type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type WindowWithPrompt = Window & { __chronoInstallPrompt?: InstallPromptEvent | null };

/**
 * Single source of install state for every button on the page.
 *
 * Chrome fires beforeinstallprompt once, often before React has hydrated. The
 * inline script in app/layout.tsx stashes the event on window and re-broadcasts
 * it, so a late-mounting button can still pick it up instead of silently
 * showing manual instructions to a browser that could have installed in one
 * tap.
 */
export function useInstallPrompt() {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    setInstalled(isRunningStandalone());
    setIos(detectIos());
    setPrompt((window as WindowWithPrompt).__chronoInstallPrompt ?? null);

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPromptEvent);
    };
    const onCaptured = () => setPrompt((window as WindowWithPrompt).__chronoInstallPrompt ?? null);
    const onInstalled = () => {
      (window as WindowWithPrompt).__chronoInstallPrompt = null;
      setInstalled(true);
      setPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("chrono:install-available", onCaptured);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("chrono:install-available", onCaptured);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback(async (): Promise<"unavailable" | "accepted" | "dismissed"> => {
    if (!prompt) return "unavailable";
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    (window as WindowWithPrompt).__chronoInstallPrompt = null;
    setPrompt(null);
    if (outcome === "accepted") setInstalled(true);
    return outcome;
  }, [prompt]);

  return { prompt, installed, ios, install };
}
