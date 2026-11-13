import type { MetadataRoute } from "next";

/**
 * PWA manifest. Served at /manifest.webmanifest and linked automatically by
 * Next. "/start" resolves the destination by role, so an admin lands on the
 * dashboard, a manager on the dashboard and staff on their clock screen — a
 * fixed "/dashboard" start_url would send staff to /unauthorized.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ChronoSwift — Smart attendance",
    short_name: "ChronoSwift",
    description:
      "QR attendance, staff management and reports for modern organizations. Clock in, monitor lateness and export records.",
    id: "/",
    start_url: "/start",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#ffffff",
    theme_color: "#39765A",
    categories: ["business", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
