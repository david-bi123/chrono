import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "ChronoSwift — Smart attendance. Simple management.", template: "%s — ChronoSwift" },
  description: "Track when your team arrives, leaves, and works — all from one simple platform.",
  metadataBase: new URL(process.env.APP_URL || "http://localhost:3000"),
  verification: {
    // Google Search Console HTML-tag verification. Emits nothing when unset.
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
  openGraph: {
    title: "ChronoSwift — Smart attendance. Simple management.",
    description: "QR attendance, staff management, and reports for modern organizations.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable}`}>
      <body className="min-h-screen bg-background font-sans text-neutral-900 antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
