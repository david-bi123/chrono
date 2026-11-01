import type { Metadata } from "next";
import AcceptClient from "./accept-client";

export const metadata: Metadata = {
  title: "Accept invitation",
  description: "Set up your ChronoSwift account.",
  robots: { index: false, follow: true },
};

/** Server shell so the invitation screen renders its token state on first paint. */
export default async function Page({ searchParams }: { searchParams?: { token?: string } }) {
  return <AcceptClient token={searchParams?.token ?? ""} />;
}
