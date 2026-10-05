# ChronoSwift — Smart attendance. Simple management.

Multi-tenant staff attendance SaaS: Super Admin → Organizations → Org Admins → Staff. QR clock-in/out with server-side timestamps, tenant isolation, audit logs, Mailjet emails, CSV reports.

## Tech
Next.js 14 (App Router), TypeScript, MongoDB Atlas (Mongoose), Tailwind, Zod, bcryptjs, jose (JWT sessions in HTTP-only cookies), node-mailjet, qrcode. Deployable to Vercel.

## Quick start
1. `cp .env.example .env.local` and fill `MONGODB_URI`, `AUTH_SECRET` (≥32 chars), `APP_URL`.
2. `npm install`
3. `npm run seed` (dev only — creates superadmin@chrono.local / ChangeMe123!, Acme org, admin@acme.local / Admin123!, 5 staff / Staff123!).
4. `npm run dev` → http://localhost:3000

## Env
See `.env.example`. Mailjet optional in dev (emails log to console when unconfigured). Never commit `.env*`.

## Architecture decisions (production)
- **Sessions**: signed JWT (HS256, 7d) in `chrono_session` HTTP-only, Secure (prod), SameSite=Lax. Identity/org derived server-side from session; client values never trusted.
- **Tenant isolation**: every tenant record carries `organizationId`; all queries filter by session `orgId`; `assertOrgAccess` + middleware role gates. Unique indexes scoped per-org (e.g. staff+date, org+employeeId).
- **Invitations/password reset**: `crypto.randomBytes` raw token emailed once; only SHA-256 hash stored; 72h (invites) / 60m (reset); single-use via `usedAt`.
- **QR**: per-location random token `chr_<hex>`; only hash stored; lookup by hash; ACTIVE/REVOKED; rotate invalidates old prints. QR URL `/attendance/scan/<raw>`. Raw shown once at creation/rotation (admin must download/print then).
- **Time**: server `new Date()` only; org timezone (default Africa/Accra); UTC stored + `date` key (YYYY-MM-DD in org tz). Late = clock-in > start+grace; early = clock-out < end-15m.
- **Rate limiting**: in-memory token bucket per IP (login 10/m, invites 30/h, clock 20/m). On Vercel serverless this is per-instance — use Upstash Redis for distributed limiting in production.
- **Audit**: `writeAudit` on login, org/staff/invite, QR, clock, corrections, settings. Read-only via API.
- **Email**: central `lib/email/mailjet.ts`; dev fallback logs to console.

## Roles & routes
- `/` landing · `/login` · `/forgot-password` · `/reset-password?token=` · `/accept-invitation?token=`
- `/super-admin`, `/super-admin/organizations`, `/new`, `/super-admin/audit` (SUPER_ADMIN)
- `/dashboard` (overview), `/attendance`, `/staff`, `/qr`, `/reports`, `/settings`, `/audit-logs` (ORG_ADMIN)
- `/staff`, `/staff/history`, `/staff/profile` (STAFF)
- `/attendance/scan/<token>` (public page, auth-aware)
- APIs under `/api/...` enforce the same checks server-side.

## Testing
`npm test` (vitest): attendance rules, token hashing. Manual checklist in spec §31: duplicate clock-in/out, wrong-org QR, revoked QR, disabled staff, timezone, exports.

## Deploy (Vercel)
Set env vars in Vercel dashboard, `APP_URL=https://<your-app>.vercel.app`, deploy. Ensure MongoDB Atlas IP allowlist + `MONGODB_URI`.

## Security notes
Change seed passwords; rotate `AUTH_SECRET` safely (invalidates sessions); keep Mailjet/Mongo secrets server-only; QR proves scan of code, not physical presence (geofencing is a future opt-in).
