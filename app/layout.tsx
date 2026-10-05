import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: { default: "ChronoSwift — Smart attendance. Simple management.", template: "%s · ChronoSwift" },
  description: "Track when your team arrives, leaves, and works — all from one simple platform.",
  metadataBase: new URL(process.env.APP_URL || "http://localhost:3000"),
  openGraph: {
    title: "ChronoSwift — Smart attendance. Simple management.",
    description: "QR attendance, staff management, and reports for modern organizations.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-background font-sans text-neutral-900 antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
