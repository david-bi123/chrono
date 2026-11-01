import type { Metadata } from "next";
import ResetClient from "./reset-client";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Choose a new password for your ChronoSwift account.",
  robots: { index: false, follow: true },
};

/** Server shell so the reset form renders on first paint with its token state. */
export default async function Page({ searchParams }: { searchParams?: { token?: string } }) {
  return <ResetClient token={searchParams?.token ?? ""} />;
}
