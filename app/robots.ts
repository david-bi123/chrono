import type { MetadataRoute } from "next";

/**
 * robots.txt served at /robots.txt.
 *
 * Auth screens (/login, etc.) are deliberately NOT listed here: a Disallow
 * prevents crawlers from fetching the page, so they could never see the
 * `noindex` meta tag on it. Those pages carry `robots: { index: false }`
 * metadata instead, which both Google and other engines understand.
 */
export default function robots(): MetadataRoute.Robots {
  const base = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        disallow: ["/api/", "/attendance/scan/", "/dashboard", "/staff", "/super-admin"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
