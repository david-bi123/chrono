"use client";
import { useState } from "react";
import { AlertTriangle, Check, Copy } from "lucide-react";

export function SpamNotice({ email, compact }: { email?: string; compact?: boolean }) {
  return (
    <div
      className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[13px] leading-relaxed text-amber-900"
      role="status"
    >
      <span className="font-semibold">📧 Email sent{email ? ` to ${email}` : ""}.</span>{" "}
      Can&apos;t find it? Check your <strong>Spam</strong> and <strong>Promotions</strong> folders
      {!compact && (
        <>
          {" "}— new senders often land there. If found, click{" "}
          <strong>Report not spam</strong> and add the sender to your contacts so future
          invites arrive in your inbox.
        </>
      )}
    </div>
  );
}

/**
 * Shown when an invitation email couldn't be delivered (provider error or
 * email not configured). Gives the operator the one-time setup link to share
 * manually instead of leaving the account stranded with no way in.
 */
export function SetupLinkPanel({ link, email }: { link: string; email?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (permissions, non-secure context) — the link
      // stays visible so it can be selected and copied manually.
    }
  }

  return (
    <div
      role="status"
      className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-left"
    >
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
        <div>
          <div className="text-[13.5px] font-semibold text-amber-900">
            We couldn&apos;t send the email{email ? ` to ${email}` : ""}.
          </div>
          <p className="mt-0.5 text-[13px] leading-relaxed text-amber-800">
            Share this one-time setup link manually instead — it expires in 72 hours and can only be used once.
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-stretch gap-2">
        <code className="min-w-0 flex-1 break-all rounded-lg bg-white px-3 py-2 font-mono text-[11.5px] leading-relaxed text-neutral-700 ring-1 ring-amber-200">
          {link}
        </code>
        <button
          type="button"
          onClick={copy}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-neutral-900 px-3 text-[13px] font-semibold text-white transition hover:bg-neutral-700 active:scale-[0.98]"
        >
          {copied ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
