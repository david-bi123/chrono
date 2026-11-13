# ChronoSwift — subscription tiers, entitlements and visual redesign

Delivered: 2026-11-12. Status: code complete, tests green, production workspace migrated.

---

## 1. What was built

Three commercial tiers, enforced server-side, with Paystack plumbing behind env vars and a
super-admin console that can assign/extend/suspend plans by hand.

| Plan | Price | Staff | Managers | Branches | History |
| --- | --- | --- | --- | --- | --- |
| Starter | GH₵500 / 6 mo | 30 | 2 | 1 | 6 months |
| Growth | GH₵750 / 6 mo | 70 | 5 | 3 | 12 months |
| Business | GH₵1,000 / 6 mo | unlimited | unlimited | unlimited | unlimited |

Plans are defined once in `lib/subscriptions/plans.ts`; nothing else hard-codes a plan ID or a
limit. A missing or unknown plan resolves to **Starter** — a data problem can never unlock
Business by accident.

---

## 2. Subscription architecture

```
lib/subscriptions/plans.ts          plan catalogue: prices, limits, feature flags, helpers
lib/subscriptions/entitlements.ts   the only place limits are computed or asserted
        ├── getEntitlements(orgId)  plan + live usage + limits + remaining + history window
        ├── assertActiveSubscription  blocks PAST_DUE / SUSPENDED / CANCELLED writes
        ├── assertCanAdd(resource)    staff | managers | branches
        ├── assertFeature(feature)    feature flags
        └── assertHistoryAccess(date) clamps reports/attendance to the history window
```

- Usage is counted live: staff seats include **pending invitations** (they are `PENDING` users),
  disabled accounts free their seat; branches count `ACTIVE` locations only.
- Every rejection is a structured 403/402 payload: `{ code, message, details: { resource,
  usage, limit, upgradeTo } }` — `PLAN_LIMIT_REACHED`, `FEATURE_NOT_IN_PLAN`,
  `SUBSCRIPTION_INACTIVE`. The UI renders the limit, current usage and the upgrade path from
  the same payload.
- Downgrades never delete data: limits gate *new* writes, old attendance stays readable until
  the new, shorter history window applies. Nothing cascades.

**Enforcement points (server-side only):**

| Route | Guard |
| --- | --- |
| `POST /api/org/staff` | seat limit, subscription active |
| `POST /api/org/managers` | manager seat limit, subscription active |
| `POST /api/org/locations` | branch limit |
| `GET /api/org/reports`, `/api/org/attendance` | history window clamp |
| `PATCH /api/org/staff/[id]`, attendance mutations | subscription active |

**Paystack** (`lib/payments/paystack.ts`, `app/api/payments/paystack/webhook/route.ts`,
`app/api/org/subscription/checkout/route.ts`):

- Checkout is created server-side with the secret key; the plan and amount come from the
  catalogue, never from the client.
- The webhook verifies the `x-paystack-signature` HMAC before parsing, then re-verifies the
  transaction against the Paystack API.
- Processing is idempotent: a `Payment` record keyed by Paystack reference is written and the
  activation only happens on the first successful pass, so replays are no-ops.
- Manual super-admin assignment stays fully functional and independent of Paystack.
- The webhook is public in `middleware.ts`; the route path must be registered in the Paystack
  dashboard as `{APP_URL}/api/payments/paystack/webhook`.

---

## 3. Database changes

Production (`chrono`), applied with confirm-gated scripts and audited:

- `Organization`: `plan`, `subscriptionStatus`, `planStartedAt`, `currentPeriodEnd`,
  `billingExempt`.
- `User`: `MANAGER` added to the role enum; optional `locationId` branch association.
- `Payment` (new): Paystack reference, plan, amount, status, raw payload, idempotency key.
- `SubscriptionEvent` (new): `PLAN_ASSIGNED`, `PLAN_CHANGED`, `STATUS_CHANGED`,
  `PERIOD_EXTENDED`, `PAYMENT_SUCCEEDED`, `PAYMENT_FAILED` — the change history shown to both
  the org and the super admin.
- Index migration: dropped the sparse `{organizationId, employeeId}` index and recreated it as
  `unique partial {employeeId: {$type: "string"}}`, so many staff without an employee ID are
  allowed while real IDs stay unique per org.

Production data: **SamTech Labs → BUSINESS / ACTIVE / billingExempt**, recorded as three
`SubscriptionEvent`s plus audit entries. No other documents were modified.

---

## 4. Managers are a real role

`MANAGER` is a first-class role, not a badge:

- Org-wide **read-only** oversight: dashboard, staff roster, attendance, reports, branches,
  manager roster.
- Blocked from settings, plan/billing, staff invitations, manager invitations, branch creation,
  and any staff mutation.
- Optional branch scope via `User.locationId`.
- Invites use the existing single-use token flow (`sendManagerInvitation`).
- Covered by two integration tests: manager seat limit on Starter, and the read-only boundary
  (GET 200 / POST 403 across staff, managers and branches).

Sidebar navigation and write actions are role-aware (`canManage`), so managers see the data and
not the controls.

---

## 5. Redesign — screens changed

Brand identity kept (evergreen `brand-*`, display serif) and sharpened; no navy/electric-blue pivot.

**Public**
- `/` landing: pricing cards fed by the plan catalogue, a feature comparison matrix, and
  "Request a workspace" mailto CTA — no self-serve signup.
- `/login`, `/register` and auth shell restyled.
- New landing components: hero time chip, product preview, product tour, mobile nav.

**Organization**
- `/dashboard`: rebuilt around real data — clock card, stat cards, 7-day and 30-day attendance
  charts, empty states (`ChartEmpty`) when a window has no clock-ins.
- `/dashboard/subscription` (new): current plan, usage meters for staff/managers/branches,
  history window, plan comparison + upgrade path, plan history timeline, payment history.
- `/dashboard/managers` (new): manager roster, invite modal, branch assignment, disable.
- Staff, attendance, reports, settings, QR: visual pass (tables, filters, badges, pagination).
- Shell: role-aware nav with correct active state, real breadcrumb title, org name in the mobile
  topbar, full user name in the sidebar.

**Super admin**
- `/super-admin`: MRR, plan distribution, access model, recent organisations.
- `/super-admin/organizations`: plan/usage/renewal columns and a plan-change modal with period
  extension, status control, billing-exempt toggle and change history.
- `/super-admin/organizations/new`: plan selection cards plus billing-exempt switch.
- `/super-admin/audit`: unchanged data, restyled.

No fabricated metrics, charts, testimonials or dead controls anywhere.

---

## 6. Verification

- `npx tsc --noEmit` — clean.
- `npm run lint` — clean, no warnings.
- `npx vitest run` — **85 tests / 14 files passing**, including 11 subscription integration
  tests (plan assignment, 31st-seat block counting pending invites, manager seat limit, manager
  read-only boundary, second-branch block, history clamp + unlock after upgrade, usage reporting,
  suspension) and unit suites for entitlements and Paystack signature/idempotency.
- Visual QA: Playwright scripts (`output/qa-shots.mjs`, `output/install-buttons-check.mjs`,
  `output/pwa-check.mjs`, `output/pwa-offline-check.mjs`) against the real production database at
  1440 / 1100 / 390 px. Screens captured in `output/qa/`: landing pricing, dashboard,
  subscription, managers, staff, attendance, reports, settings, super-admin home, organisations,
  new organisation, audit, plan modal, manager invite modal, install button + dialog.
- Defects found and fixed in the loop: double-highlighted nav item, breadcrumb showing the nav
  group instead of the page, stale sidebar org chip, truncated stat labels, unlabelled empty
  charts, ambiguous plan-history lines (`STATUS_CHANGED` vs plan change), badge wrapping on
  mobile, pluralisation in the pagination counter, "Billing exempt." spacing.

---

## 7. Remaining issues / actions for you

1. **Rotate the Paystack live secret key.** It was printed in plain text in a tool output during
   setup. Then confirm the final key in `.env.local` (`PAYSTACK_LIVE_SECRET_KEY`,
   `PAYSTACK_LIVE_PUBLIC_KEY`).
2. **Register the webhook URL** in the Paystack dashboard:
   `{APP_URL}/api/payments/paystack/webhook`.
3. **Manager screens were not visually QA'd** — production has no manager account. Behaviour is
   covered by integration tests only; create a manager on a test workspace to eyeball the nav.
4. **`scripts/` is now tracked** — `scripts/set-org-plan.mjs` (the confirm-gated production plan
   change) and `scripts/migrate-user-employee-index.mjs` (the index migration) are in version
   control alongside the read-only audit/probe scripts and the PWA icon generator.
5. **Committed and pushed** — everything is on `origin/main` (`9d2154f`, `06507b8`, `a897923`,
   plus the install-button commit). Screenshots and verification scripts under `output/qa/` are
   committed too, so the QA evidence travels with the code.

---

## 8. Installable app (PWA)

Added 2026-11-13. No store accounts, no review, no second codebase.

- `app/manifest.ts` serves `/manifest.webmanifest`: standalone display, evergreen theme
  (`#39765A`), 192/512 icons plus a maskable 512, and `start_url: /start`.
- `app/start/route.ts` resolves the launch by role — super admin → `/super-admin`, admin or
  manager → `/dashboard`, staff → `/staff`, no session → `/login`. A fixed `/dashboard`
  start_url would have sent staff to `/unauthorized`.
- `public/sw.js` caches hashed static assets and precaches `/offline`; navigations are
  network-first and are **never** cached, and `/api/*` never enters a cache. That rule is what
  keeps one organisation's data off another user's shared phone.
- `components/pwa/pwa-provider.tsx` registers the worker in production only and shows a
  "new version ready → Reload" bar, using `skipWaiting` only after the user chooses.
- `components/pwa/install-card.tsx` in Settings → App: one-tap install where Chromium fires
  `beforeinstallprompt`, step-by-step Share → Add to Home Screen for iOS, and an installed
  state with confirmation.
- Icons are generated from the clock mark by `scripts/generate-pwa-icons.mjs` (Playwright),
  so they stay crisp at any size instead of being upscaled favicons.

Verified against a production build (`output/pwa-check.mjs`, `output/pwa-offline-check.mjs`):
19/19 installability checks pass, the worker controls the page after reload, a real offline
navigation shows the branded page, no `/api/` response is ever cached, `/start` redirects
correctly for signed-out and signed-in users, and the synthetic `beforeinstallprompt` path
invokes `prompt()`. No offline clock-in queue exists by design: attendance is verified
server-side, so writes are not queued locally.

---

## 9. Download / install button

Added 2026-11-13. The app was installable before this, but only from the browser's own menu —
which most staff never open. There is now a visible button in four places, so "get the app" is
one tap, not a hunt.

Where it appears:

| Location | Form | Notes |
| --- | --- | --- |
| Landing header (`app/page.tsx`) | labelled "Get the app" at ≥1280 px, icon-only 1024–1279 px | always visible, never hidden behind a menu |
| Landing mobile menu (`components/landing/mobile-nav.tsx`) | full-width "Install the app" row | closes the menu, then opens the dialog |
| Landing closing CTA | outline "Install the app" next to *Sign in* | catches visitors who read to the end |
| Dashboard topbar (`components/dashboard/shell.tsx`) | icon button for every role | admin, manager and staff all get it |
| Settings → App (`components/pwa/install-card.tsx`) | full card with steps | the place to look when the button confuses someone |

Behaviour, deliberately not a dead button:

- Chromium (Android Chrome, desktop Chrome/Edge) fires `beforeinstallprompt` → the button calls
  `prompt()` and the OS install sheet appears. One tap, real install.
- iOS Safari and Firefox never fire it. Rather than hide the button, it opens a dialog with the
  exact steps (Share → Add to Home Screen on iOS, browser-menu install elsewhere). iOS Chrome is
  called out as unable to install, instead of letting someone tap a button that cannot work.
- Inside the installed app the buttons render `null`, so nobody is told to install what they are
  already running.

`components/pwa/install-app-button.tsx` speaks in four variants (solid / outline / ghost / menu)
so the same control fits a header, a CTA and a list row. `components/pwa/use-install-prompt.ts`
is the single source of install state; `components/pwa/install-instructions.tsx` holds the
platform detection and step copy shared by the button and the settings card.

One non-obvious fix: Chrome fires `beforeinstallprompt` once and often **before React hydrates**,
so a component-level listener alone silently misses it and falls back to instructions for no
reason. `app/layout.tsx` now stashes the event in an inline `<head>` script
(`window.__chronoInstallPrompt`) and broadcasts `chrono:install-available`; the hook picks up the
stashed event on mount. That is why the native-prompt test passes against a cold page load.

Verified (`output/install-buttons-check.mjs`, 13/13 against a production build): labelled header
button at 1440, icon button at 1100, mobile menu row opens the dialog and the menu closes behind
it, closing CTA present, dialog explains the browser-menu path, synthetic
`beforeinstallprompt` is used and suppresses the dialog, buttons disappear under
`display-mode: standalone`, and the dashboard topbar button opens the dialog when signed in.


