import type { Metadata } from "next";
import { safeNextPath } from "@/lib/auth/redirect";
import LoginClient from "./login-client";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your ChronoSwift workspace.",
  robots: { index: false, follow: true },
};

/**
 * Server shell: reads the query string here so the sign-in form is fully
 * rendered on first paint (no client-only blank flash). The `next` target is
 * sanitised server-side with the same open-redirect allowlist used elsewhere.
 */
export default async function Page({
  searchParams,
}: {
  searchParams?: { next?: string; invited?: string; reset?: string };
}) {
  const sp = searchParams ?? {};
  return (
    <LoginClient
      next={safeNextPath(sp.next)}
      invited={Boolean(sp.invited)}
      reset={Boolean(sp.reset)}
    />
  );
}
