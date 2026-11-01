import type { Metadata } from "next";
import ForgotClient from "./forgot-client";

export const metadata: Metadata = {
  title: "Reset your password",
  description: "Request a secure password reset link for your ChronoSwift account.",
  robots: { index: false, follow: true },
};

export default function Page() {
  return <ForgotClient />;
}
