import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast";
import { PwaProvider } from "@/components/pwa/pwa-provider";
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
  applicationName: "ChronoSwift",
  // iOS ignores the web manifest for these: without them "Add to Home Screen"
  // opens in Safari with browser chrome instead of as an app.
  appleWebApp: {
    capable: true,
    title: "ChronoSwift",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  formatDetection: { telephone: false },
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#39765A",
};

/**
 * Chrome fires beforeinstallprompt once, and often before React hydrates. If we
 * only listened in a component the event would be lost and the install button
 * would fall back to manual instructions for no reason. This runs in <head>,
 * stashes the event, and pings any button that mounts later.
 */
const INSTALL_PROMPT_CAPTURE = `window.__chronoInstallPrompt=null;window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__chronoInstallPrompt=e;window.dispatchEvent(new Event("chrono:install-available"));});`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: INSTALL_PROMPT_CAPTURE }} />
      </head>
      <body className="min-h-screen bg-background font-sans text-neutral-900 antialiased">
        <ToastProvider>
          {children}
          <PwaProvider />
        </ToastProvider>
      </body>
    </html>
  );
}
