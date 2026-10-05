import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Chrono — Smart attendance. Simple management.", template: "%s · Chrono" },
  description: "Track when your team arrives, leaves, and works — all from one simple platform.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    title: "Chrono — Smart attendance. Simple management.",
    description: "QR attendance, staff management, and reports for modern organizations.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-[#F6F7F9] font-sans text-neutral-900 antialiased">
        {children}
      </body>
    </html>
  );
}
