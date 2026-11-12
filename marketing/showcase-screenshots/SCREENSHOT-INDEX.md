# ChronoSwift — Showcase Screenshot Index

Captured from the **real running application** via Playwright (Chromium),
production build (`next start`) + live server. Viewport specs:

- Desktop: 1440 × 1000
- Mobile: 390 × 844

All screenshots live under `marketing/showcase-screenshots/`:

- `desktop/` — framed viewport shots (1440×1000)
- `mobile/` — full-page shots (390×844)
- `full-page/` — full-page desktop shots (1440 wide)
- `feature-highlights/` — single-section shots of the landing page

---

## Image index

| File | Dimensions | What it shows | Best use |
|---|---|---|---|
| `feature-highlights/landing-hero.png` | 1440×1000 | Landing hero: green gradient, "Clock in with a scan. Run attendance from one dashboard." badge, CTAs, scan→tap→record flow | TikTok/IG hook, LinkedIn cover |
| `full-page/landing-full.png` | 1440×4988 | Entire landing page, one continuous scroll narrative | Blog post header, YouTube thumbnail, landing-page asset |
| `feature-highlights/landing-how-it-works.png` | 1440×1000 | "Live in three steps" — org creation, invite/QR, scan & report | TikTok value-prop opener, carousel slide |
| `feature-highlights/landing-features.png` | 1440×1000 | Features grid (QR clock-in, late/absence, staff mgmt, reports, isolation, audit) | LinkedIn carousel, IG grid |
| `feature-highlights/landing-security.png` | 1440×1000 | Security section — "Secure by design, not by promise" + checklist | Trust slide, LinkedIn carousel |
| `feature-highlights/landing-faq.png` | 1440×1000 | FAQ — honest answers (no app install, QR limits, timezone, clocking for each other) | Carousel FAQ slide, TikTok Q&A |
| `feature-highlights/landing-cta.png` | 1440×1000 | CTA panel — "Ready to ditch the paper register?" | Closing frame of promo video, IG post |
| `full-page/terms-full.png` | 1440×2636 | Terms of Service full page (public) | Legal/authority asset, not promo |
| `full-page/privacy-full.png` | 1440×2795 | Privacy Policy full page (public) | Legal asset |
| `desktop/login.png` | 1440×1000 | Sign-in screen (public) | Auth-flow promo |
| `desktop/terms.png` | 1440×1000 | Terms viewport | Legal |
| `desktop/privacy.png` | 1440×1000 | Privacy viewport | Legal |
| `mobile/landing-full.png` | 390×8059 | Full landing page on phone | TikTok/Instagram full-screen storytelling |
| `mobile/login-full.png` | 390×844 | Mobile sign-in | Mobile auth promo |

## Recommended 5–8 shots for a promotional video (priority order)

1. **`feature-highlights/landing-hero.png`** — 0–3s hook. The product promise in one frame. Best TikTok opener.
2. **`feature-highlights/landing-how-it-works.png`** — 3–8s. Three steps tell the whole story; perfect for kinetic text overlay.
3. **`full-page/landing-full.png`** — 8–15s. Full narrative arc of the page in one scroll.
4. **`feature-highlights/landing-features.png`** — 15–22s. Social-proof/feature montage.
5. **`feature-highlights/landing-security.png`** — 22–26s. Trust segment.
6. **`mobile/landing-full.png`** — 26–32s. Phone-native version for TikTok/IG Reels — the audience is staff-facing, so mobile framing lands hardest.
7. **`feature-highlights/landing-cta.png`** — closing frame.

## TikTok (9:16) presentation plan

- Source assets: `mobile/landing-full.png` (full-page story) + `feature-highlights/*.png` (single-frame beats).
- Safe zones: keep key text clear of the top/bottom 15% (UI chrome, captions).
- Frame durations: hero 2.5s → how-it-works 3s → full-page scroll segment 6s → features 4s → security 2.5s → CTA 2s.
- Captions: add text overlays ("One QR. One tap. Done." / "No app installs." / "Scan → tap → recorded.") — screenshots stay authentic/readable, overlays are marketing.
- Export: 1080×1920 (9:16), 30fps.

## Integrity notes

- Screenshots are of the **real running app** — no mock UI.
- Public pages only at this stage (auth screens + landing + legal). Authenticated dashboard shots (`/dashboard`, `/dashboard/reports`, `/dashboard/qr`, `/dashboard/staff`, `/dashboard/attendance`, `/dashboard/audit-logs`, `/dashboard/settings`, `/super-admin/*`) are **pending** and will be captured after login once demo credentials are supplied.

---

*Last updated: 2026-11-03*
