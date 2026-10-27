# ChronoSwift — Smart Attendance. Simple Management.

A multi-tenant staff attendance management platform for organizations of any size. Staff clock in and out by scanning a QR code posted at the workplace. Every timestamp is recorded by the server, every late arrival is detected automatically, every record is exportable, and every action is written to a permanent audit log.

ChronoSwift replaces paper registers, shared spreadsheets, and biased manual sign-ins with one system that admins can trust and staff can use in seconds — no app install required.

---

## Table of Contents

1. [The Product at a Glance](#1-the-product-at-a-glance)
2. [How the Platform Is Organized](#2-how-the-platform-is-organized)
3. [The Four Levels, End to End](#3-the-four-levels-end-to-end)
   - [Level 1 — The Platform Owner (Super Admin)](#level-1--the-platform-owner-super-admin)
   - [Level 2 — The Organization Admin](#level-2--the-organization-admin)
   - [Level 3 — QR Codes for Physical Locations](#level-3--qr-codes-for-physical-locations)
   - [Level 4 — Staff and the Daily Clock-In Flow](#level-4--staff-and-the-daily-clock-in-flow)
4. [How Attendance Is Judged (The Rules Engine)](#4-how-attendance-is-judged-the-rules-engine)
5. [Reports and Exports](#5-reports-and-exports)
6. [The Staff Self-Service Portal](#6-the-staff-self-service-portal)
7. [The Audit Trail](#7-the-audit-trail)
8. [Automated Emails](#8-automated-emails)
9. [Security Model](#9-security-model)
10. [A Day at Acme Technologies (Walkthrough)](#10-a-day-at-acme-technologies-walkthrough)
11. [Frequently Asked Questions](#11-frequently-asked-questions)
12. [Technical Appendix](#12-technical-appendix)

---

## 1. The Product at a Glance

| What | Detail |
|---|---|
| Product | ChronoSwift — multi-tenant staff attendance SaaS |
| Core flow | Staff scan a location QR code and clock in/out. Server timestamps only. |
| Audience | Platform provider runs it once; each customer organization manages its own staff privately. |
| Roles | Platform Owner (Super Admin) → Organization Admin → Staff |
| Record types | Present, Late, Early Leave, Half Day, Incomplete, On Leave, Absent (derived) |
| Admin tools | Live dashboard, staff directory, QR management, attendance corrections, date-range reports, CSV export |
| Built-in trust | Tenant isolation, hashed tokens, server-side clocks, rate limiting, permanent audit trail |
| Access | Web-based — works on any phone, tablet, or laptop browser. Nothing to install. |

**The one-line pitch:** *Your staff stop lying about when they arrived; your admin stops arguing about it.* Clock-in times come from the server, not from anyone's wristwatch or phone clock, and no one can edit a record without leaving a permanent, justified trail.

---

## 2. How the Platform Is Organized

ChronoSwift is **multi-tenant**: one deployment of the platform (and one database) serves many independent customer organizations, while guaranteeing that no organization can ever see, reach, or touch another's data.

```
                 ┌─────────────────────────────┐
                 │   PLATFORM OWNER (Us/You)   │
                 │        Super Admin          │
                 │  Creates & manages tenants  │
                 └──────────────┬──────────────┘
                                │ provisions
              ┌─────────────────┼─────────────────┐
              ▼                 ▼                 ▼
      ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
      │ Organization  │ │ Organization  │ │ Organization  │
      │      A        │ │      B        │ │      C        │
      │ Org Admin     │ │ Org Admin     │ │ Org Admin     │
      └───────┬───────┘ └───────────────┘ └───────────────┘
              │ invites
              ▼
      ┌───────────────┐
      │  Staff         │
      │ (clock in/out) │
      └───────────────┘
```

Three account types, three separate workspaces, three sets of permissions:

| Role | Who | What they control |
|---|---|---|
| **Super Admin** | The platform owner (the company selling ChronoSwift to clients) | Creates organizations, suspends/resumes tenants, sees platform-wide stats and activity |
| **Organization Admin** | The client's manager/HR person | Staff, QR codes, attendance records, corrections, reports, settings, org audit log |
| **Staff** | The client's employees | Own clock-in/out, own attendance history, own profile |

Every account belongs to exactly one organization (except the Super Admin, who sits above all tenants). A staff member at Organization A scanning Organization B's QR code is refused — automatically and instantly.

---

## 3. The Four Levels, End to End

### Level 1 — The Platform Owner (Super Admin)

This is you — the person running ChronoSwift and onboarding customer businesses.

**What the Super Admin can do:**

- **Create an organization in under a minute.** Fill in the client's company profile (name, contact email, phone, address, industry) plus the details of the person who will administer it (their name and email). ChronoSwift then:
  1. Creates the tenant organization, instantly isolated from every other tenant.
  2. Creates the Organization Admin's account in a *pending* state.
  3. Emails the admin a **one-time setup link valid for 72 hours**.
- **Track the whole platform from one screen.** The Super Admin dashboard shows how many organizations exist, how many active staff and admins are on the platform, how many attendance events happened today, and the most recent tenants added.
- **Manage tenants without ever entering them.** The organizations page is a searchable, paginated table showing each org's name, contact, live staff count, creation date, and status badge.
- **Suspend or reinstate any tenant.** Suspending an organization immediately blocks its admins and staff from signing in, clocking in, or receiving new invitations. Reinstating restores them. (A tenant is suspended for non-payment or policy violation; their data is never touched or deleted.)
- **Rescue an admin who lost their invite.** If an org admin never clicked their setup link, the Super Admin can re-send a fresh invitation — old unused links are automatically invalidated so exactly one valid link exists at a time. If the email can't be delivered (spam filters etc.), ChronoSwift displays the raw setup link so onboarding can continue manually.
- **See everything.** A platform-wide activity feed records tenant creation, admin actions, logins, and more.

**Onboarding a new client = one form, one email.** No database work, no deployment, no configuration files.

### Level 2 — The Organization Admin

The moment a client's admin clicks their setup link, they set their password (with a live strength checklist) and land in their own private workspace. This is the client's entire command center.

**The admin workspace is a sidebar-driven dashboard with these sections:**

#### Overview (`/dashboard`)
- **Today's attendance at a single glance** — a big attendance-rate percentage, a present/late/absent breakdown bar, and four live counters: **Total staff, Working now, Late, Absent.**
- **Today's activity table** — every staff member with avatar, department, clock-in time, clock-out time, hours worked, and a status badge. People currently on the clock show a pulsing **WORKING** indicator until they clock out.
- **A recent-activity timeline** of clock-ins and clock-outs as they happen.
- **A shifts-completed strip** linking straight to reports.

The moment staff start scanning QR codes in the morning, this screen fills itself. It is the screen the admin leaves open on the office monitor.

#### Attendance (`/dashboard/attendance`)
- A full, filterable attendance register. Pick any date (defaults to today), filter by status (Present / Late / Early leave / Half day / Incomplete), and search by name, email, or employee ID. Shows 50 records per page, with department, clock-in/out times, hours, and the location (which QR code was used).
- **Correct a record when reality and the system disagree** (e.g., a server was down, someone forgot to clock out). The admin opens a correction dialog, enters the true clock-in/clock-out times, and *must* provide a written reason (minimum 5 characters). The record is flagged as manually corrected, stamped with who corrected it, and the full before/after snapshot plus the reason is written permanently to the audit log. Nothing changes silently.
- **One-click CSV export** of the day.

#### Staff (`/dashboard/staff`)
- **Invite staff by email.** First name, last name, email, employee ID (unique within the organization), department, position, phone. The staff member receives an invitation email with a 72-hour setup link; they choose a password and go active. If the email fails to deliver, the admin is handed the setup link to share any way they like.
- **A real staff directory you can search** — search box (name, email, employee ID), department filter (built automatically from your staff list), and status filter (Active / Pending / Disabled).
- **Per-staff profile pages** — contact details, employee ID, department/position, join date, and a 30-day attendance summary (records, present days, late arrivals, total hours, attendance percentage) plus their full attendance table (up to 120 days back).
- **Handle leavers without deleting anything** — leaving staff are *disabled* rather than deleted, preserving all history. A disabled account can't sign in or clock in, and can be re-activated any day (with full confirmation dialogs for both).
- **Resend invitations** for pending staff any time — each resend invalidates every link previously issued to that person.

#### QR Codes (`/dashboard/qr`)
Managed in full detail in the next section, but summarized per location as cards with ACTIVE/REVOKED status.

#### Reports (`/dashboard/reports`)
Covered in Section 5.

#### Settings (`/dashboard/settings`)
- **Organization details** — name, contact email, phone, industry, timezone, address. These appear on staff invitations, reports, and printed QR sheets.
- **Attendance rules** (the heart of the system):
  - **Work start** and **work end** times (e.g. 08:00–17:00)
  - **Grace minutes** (0–120) — how late someone may clock in before being marked Late
  - **Working days** — toggle any combination of Sunday–Saturday (Mon–Fri default, at least one day required)
  - **Require clock-out** — if on, a shift without a clock-out stays flagged Incomplete until the admin corrects it
  - Everything is timestamped in the organization's own timezone (IANA timezone selector, e.g. Africa/Accra; rules apply to future clock-ins only — past records are never re-judged retroactively)
- **Security** — password change for the admin (current password verified; new password must meet policy).

#### Audit Logs (`/dashboard/audit-logs`)
Only the admin can open this. It shows their organization's complete, read-only activity feed — every login, invitation, QR change, clock event, correction, and settings change, with timestamps, IP addresses, and the human-readable reason attached to each correction.

### Level 3 — QR Codes for Physical Locations

ChronoSwift doesn't assume your staff work in one place. Each **location** — main office, branch, warehouse, workshop, construction site — gets its own dedicated QR code.

**The lifecycle:**

1. **Create a location** ("Main Office", "Warehouse B"…). ChronoSwift mints a cryptographically random token, prints a branded QR sheet — your organization's name, the location name ("Scan at Main Office"), the QR itself, and the scan URL beneath it for anyone who can't scan — and gives the admin a **downloadable PNG and a print button** styled specifically for printing.
2. **Print it, post it.** The admin sticks the sheet at the entrance wall, reception, or the site container.
3. **The code is shown exactly once.** After creation, ChronoSwift stores *only* a cryptographic hash of the token — never the code itself. If the printout is lost or the admin forgets to download it, they simply regenerate a fresh code. This means even a stolen screenshot of the database is useless for creating fake codes.
4. **Rotate it any time.** If a code gets photographed and circulated (printed on a wall sticker that ended up online, for instance), the admin clicks Regenerate. Every previously printed copy — including photos and copies of photos — **stops working permanently and immediately**. Nothing needs redeploying; you just print the new one.
5. **Revoke it** to lock a location out entirely (e.g. during an event or dispute). Staff scanning a revoked code see a clear "code unavailable — ask your administrator" screen rather than a raw error, and the admin can restore it later by regenerating.

**That means:** one location's code being compromised never compromises any *other* location's code, at any organization. Each code is a single, independently revocable key.

### Level 4 — Staff and the Daily Clock-In Flow

This is the moment that matters most — the two taps a staff member makes 20 times a week. Here is exactly what happens, in order.

#### The flow, step by step

1. Staff arrive at the workplace and scan the QR code posted at the entrance with their **phone camera**. This opens the scan link: `/attendance/scan/<token>`.
2. ChronoSwift looks the code up, confirms it belongs to a live organization, and shows the person who they are dealing with: the **organization's name, the location's name, the live current time in the organization's timezone**, and their sign-in state.
3. **Three things can now happen:**
   - **Not signed in yet** (most common at 7:55am on a new phone): they tap *Sign in*, sign in once, and are returned straight to the clock screen with the QR token still attached — signing in doesn't lose them their scan.
   - **Signed in to the wrong organization** (someone sharing a work phone, a freelance "moonlighter"): they see *"This code isn't for you"* with the organization it belongs to and their own signed-in account named, plus a one-tap switch-account option.
   - **Signed in and matching** → they land on the clock screen immediately.
4. The clock screen shows a **live clock**, the org and location names, and one enormous button: **Clock In**.
5. They tap it. Instant confirmation with the exact recorded time and a success animation. The button becomes **Clock Out** for the rest of the day.
6. At end of shift, they scan the same code and tap Clock Out. Their hours are computed; they're done.

#### What the server does at each clock event — and why you can trust the numbers

- **Time is taken from the server, not the phone.** Neither the staff member's phone clock nor their browser can alter what gets recorded.
- **Grace rules are applied automatically.** Clock-in at or before 08:15 (with a 15-minute grace on an 08:00 start) = **Present**. At 08:16 = **Late**. No discussion, no mood, no discretion.
- **Hours are computed on clock-out** (or stays open if the require-clock-out setting demands admin correction of a forgotten clock-out).
- **Status is judged in the organization's timezone** on the org's working-day calendar — clocking in at 08:05 Accra time matters, jumping border time zones doesn't shift your day.
- **Buddy-punching is strongly discouraged by design.** A clock event can only happen from the staff member's own signed-in session with the organization's valid code, one account can clock in only once per day (enforced in the database), and the clock endpoint is rate-limited per user.
- **One clock-in per person per day** is enforced at the database level — double taps, glitches, and deliberate abuse all land on the same single record, not two conflicting ones.
- **Disabled staff can't clock in.** Suspended organizations can't clock in. Revoked QR codes can't be scanned for clock events.

By the time the staff member's phone has finished the "success" animation, the admin's dashboard has already updated.

---

## 4. How Attendance Is Judged (The Rules Engine)

Every record carries one of these statuses, decided automatically by the rules engine against the org's own settings:

| Status | When it gets applied |
|---|---|
| **PRESENT** | Clock-in within the grace window |
| **LATE** | Clock-in after start + grace |
| **EARLY_LEAVE** | Clock-out more than 15 minutes before end of shift |
| **HALF_DAY** | Combination of late + short day (total hours below the 4-hour threshold) |
| **INCOMPLETE** | Shift never clocked out (requires clock-out enabled) — stays flagged until the admin corrects it |
| **ABSENT** | Derived, not stored: a full staff roster for that day minus everyone who has a record |

Key details worth knowing:

- **Grace, working days, start times, timezones are all per-organization**, set once by the admin in Settings — not hardcoded.
- **Total minutes worked is computed server-side** and never negative or fabricated; a forgotten clock-out leaves a clean "hours unknown" state rather than a fake 8 hours.
- **Late + early on the same day**: ChronoSwift doesn't just mark two flags — it decides. A late-and-early day counts as a **half day** when total hours are short, and as a **late day** when they're not.
- **Past records are never retroactively re-judged** when rules change. If you changed grace from 10 to 15 minutes last week, last week's records aren't silently rewritten.
- **Manually corrected records** are marked as coming from the admin (not the QR scanner), with the reason attached permanently.
- **Absent is derived from real data** each day — the dashboard's "Absent" count is literally "how many active people have no record yet today," which is the only definition that can't be gamed.

---

## 5. Reports and Exports

The Reports screen (`/dashboard/reports`) answers the questions a manager actually asks, over any date range:

- **Attendance rate** over the period (color-graded: green when ≥ 90%, amber ≥ 75%, red below)
- **Records** in range, **days present**, **late arrivals**, and **total / average hours worked**
- **A status-mix bar** showing the present/late/early-leave distribution
- **An attendance-by-department breakdown** — which teams show up and which don't
- A filterable record table and a **one-click CSV export** of the whole range (date, employee ID, name, department, clock-in, clock-out, minutes, status) ready for payroll, auditing, or onward reporting.

The same CSV export is available from the day view too — any single day can be exported in one click. Numbers on screen are computed from the actual records, never estimated, so what the manager reads in the report is identical to what each staff member sees on their own history page.

---

## 6. The Staff Self-Service Portal

Staff have their own space, separate from admin tools:

- **My Day (`/staff`)** — When they open the app, they see their attendance status for today: clocked-in/clocked-out badge with a live "working now" pulse, today's in/out times, hours so far, a link to scan and clock now, their last-30-day stats (present days, late days, total hours, attendance %), and their recent shifts.
- **Clock screen (`/staff/clock`)** — the main clocking experience described in Section 3, including a "How to clock in" 3-step guide and a fallback paste-the-link opener for staff whose camera app won't cooperate.
- **History (`/staff/history`)** — their own 30-day record with filters and the same status badges the admin sees. Nothing is hidden from the person it concerns — this transparency is what stops disputes before they start.
- **Profile (`/staff/profile`)** — update own name and phone; change own password (current password required).

There is no app to install; every phone with a browser and a camera can do it.

---

## 7. The Audit Trail

ChronoSwift is built on the belief that in HR, *who did what, when* is just as important as *what the record says*.

Every meaningful action gets written to an immutable, read-only log — including:

| Category | Events captured |
|---|---|
| Authentication | Logins, password resets, invitations accepted |
| Organization | Created, updated, (admin invite re-sent) |
| People | Invited, invite re-sent, details updated, **disabled/reactivated** |
| Attendance | **Clock-in** (with location), **clock-out** (with total minutes), **corrections** (with the full before-values and the written reason) |
| QR codes | Generated, regenerated, revoked |
| Settings | Every configuration change, with the fields that changed |

Each entry records the timestamp, the user's IP address, their browser agent string, and structured metadata. Admins see their org's own logs; the Super Admin sees everything platform-wide. Audit entries **cannot be edited or deleted** by anyone, including the Super Admin.

Consequence for a paying customer: *when a staff member disputes their attendance record from three months ago, you open the audit log and see — out of the record's own history — who touched what and on what grounds.* That is the difference between HR software and HR evidence.

---

## 8. Automated Emails

ChronoSwift handles the emails that typically cause HR chaos, with branded, responsive, spam-aware templates:

| Trigger | Email |
|---|---|
| New organization created | "You're invited to administer {org}…" — 72-hour setup link |
| New staff invited | "You're invited to join {org}…" — 72-hour setup link |
| Invite accepted | Welcome email confirming the account is live |
| Admin/staff forgot password | Password-reset link, valid **60 minutes** |

Every email includes a clear call-to-action button, a plain fallback link, and a spam-folder notice — because that's where these emails actually end up. When the mail provider isn't configured (or delivery fails), the system never strands anyone: it hands the admin a copyable one-time setup link to send manually, and audits whether the email was actually delivered.

Invitation and reset links are **single-use**: once clicked, they're consumed; once expired, they die; and re-sending always revokes every link previously issued to the same person.

---

## 9. Security Model

ChronoSwift is designed so that the truth in the database is the only truth anyone can present. That principle, applied everywhere:

- **Tenant isolation enforced at every level.** Every record in the database carries an organization ID, and every query filters by it. The middleware blocks cross-role route access; every API endpoint independently re-checks the role and org; and page-level guards re-verify on the server before anything renders. There is no URL a staff member can type that will show them another company's data.
- **Server-side timestamps only.** Neither the client device clock, nor any browser hack, nor a multiple-edit JSON payload can change what time a clock event happened.
- **No passwords stored as text.** All passwords are bcrypt-hashed (cost 12) with a strong complexity policy (minimum 8 chars, upper + lower + digit) enforced right from the form with a live checklist.
- **All one-time tokens are hashed before storage.** Invitation tokens, reset tokens, and QR codes are hashed with SHA-256 on their way into the database. A leak of the database does not leak any working links or codes.
- **Sessions are signed, HTTP-only JWTs.** Not readable by JavaScript, signed with a server secret, expiring after 7 days, SameSite-protected — the browser does all the carrying and can't be tampered with from the page's own context.
- **Server-side validation everywhere.** Every input (including free-text fields like names and correction reasons) is validated server-side against a strict schema, not just in the browser.
- **Rate limiting on the sensitive endpoints.** Login, clock-in/out, invitations, and QR operations are all throttled per IP/user so credential stuffing, thundering-herd clock-ins, or brute-force token guessing are denied air.
- **Status controls as live safety valves.** A staff member can be disabled instantly (can't log in, can't clock in), a tenant can be suspended instantly (whole org locked out), and a QR code can be revoked instantly (any copy — paper or photo — stops working). All reversible, all logged.
- **What the product does NOT claim.** A QR code proves *a valid code for your organization was scanned from a signed-in staff member's device in their own session* — that already defeats the classic paper register and the buddy punch from an unauthorized device. It is *not* a location pin. If your policy requires proving physical presence as well, geofencing is a planned opt-in addition. ChronoSwift doesn't oversell, and we say so up front.

---

## 10. A Day at Acme Technologies (Walkthrough)

Let's watch a typical day unfold for a fictional client.

**Setup recap:** Acme works 08:00–17:00, Monday–Friday, Africa/Accra timezone, with 15 minutes of grace. One QR code is posted by the entrance of their main office. Five staff are active.

*We include this here as a concrete, client-relatable example — feel free to read it in a sales meeting.*

- **Monday, 6 weeks ago.** The ChronoSwift platform owner (a reseller of this software) created Acme Technologies in one form. Acme's HR admin clicked their email link and set their password. She invited her five staff, all of whom set passwords. She generated the "Main Office" QR code, printed it, and taped it to the lobby column. It took her about ten minutes, total.

- **Monday, 7:58am.** Samuel arrives. Camera up, code scanned, phone shows "Acme Technologies – Main Office, 07:58". He taps **Clock In**. Success: recorded at 07:58. The admin's dashboard is already showing him as WORKING.

- **Monday, 8:23am.** Efua rushes in. Clock-in recorded. Status shows **LATE** (08:23 is past 08:15). Not negotiable, not discretionary, not personal.

- **Monday, 8:41am.** Kwame arrives — and he had re-set his phone clock to 07:59 "to be safe." It didn't matter: ChronoSwift records **08:41**, straight from its own server, and marks him LATE. Whatever his phone claims is irrelevant, and everyone knows it. There is no argument to be had.

- **Monday, midday.** Staff are mid-shift; the dashboard shows who is still on the clock with live WORKING indicators. The admin glances at it from her phone during lunch.

- **Monday, end of day.** Staff swing by the code on their way out and clock off. Samuel clocks out at 17:12 → status **PRESENT**, 9h 14m recorded. Efua at 16:44 → **EARLY_LEAVE**, 8h 21m. Kwame forgets to clock out at all → his row stays open as **INCOMPLETE**, flagged for the admin to resolve.

- **Tuesday, 08:12am (grace cutoff 08:15).** Abena clocks in at 08:12 → PRESENT. Yaa at 08:16 → LATE. It genuinely is that granular.

- **Tuesday, 08:30am.** The admin reviews yesterday. Kwame's record needs a fix — she verifies he did work a full day, opens correction, sets his out-time to 17:02, and types "Forgot to clock out — confirmed present all day." She hits save. The record becomes MANUAL + CORRECTED, showing who fixed it and when, with her stated reason permanently stored in the audit log.

- **Wednesday.** Passive monitoring. She checks Reports for the last two weeks: 94% attendance overall, one department at 87% with the most lates. She notes it before the monthly review.

- **Thursday.** Yaa resigns. She's disabled, not deleted: her history is intact for the payroll cutoff, her account is dead for login and clock-ins, and if she returns next quarter, reactivation is one click.

- **Friday.** Two things nobody expected: (1) someone photographed the lobby QR code during a site visit and posted it publicly; (2) the admin saw it, clicked Regenerate, and the photo was dead within five seconds, while the freshly printed replacement went up by 10am. Nobody's day was disrupted.

- **Monday next.** The admin exports the previous day's CSV in one click and emails it to Payroll along with the total minutes per person.

Total staff effort per person per day: **two QR scans and two button taps.** Total admin effort per week: about fifteen minutes, and zero arguments about who was late.

---

## 11. Frequently Asked Questions

**Do staff need to install an app?**
No. Any phone with a camera and a browser — iOS or Android — works. The scan happens with the native camera, not a dedicated app.

**What stops a staff member clocking in from home with the code photographed?**
Honest answer: the code alone proves that a valid code for your organization was used from *that person's own signed-in session* — it is not a location pin. What makes misuse impractical is that any code can be rotated instantly from the dashboard, permanently killing every photographed copy, and codes are shown once and stored only as hashes. If your policy requires proving physical presence, geofencing is planned as an opt-in future module — ChronoSwift doesn't oversell this feature, and we say so up front.

**Can staff fake the time on their phone to change what's recorded?**
No. Time is captured from the ChronoSwift server at the moment of the request. A phone's clock is irrelevant to what gets stored.

**What if a staff member forgets to clock out?**
Their shift stays flagged **Incomplete** rather than getting a fabricated number. The admin sees the clear list of such records, and uses a correction dialog with a required written reason to resolve it. The correction, the reason, and who did it live permanently in the audit log.

**Can someone clock in for a colleague?**
To do it, someone else would need the colleague's *personal login credentials* plus the valid organization code — the shared wall code alone is not enough. On top of that, one account can only clock in once per day (enforced at the database level), the clock endpoint is rate-limited per user, and every clock event is written to the audit log with the account behind it.

**What if one org's code gets compromised — does that affect other orgs?**
No. Each QR code is a single independently hashed, independently revocable key for one location of one tenant. Revoking it affects nothing else.

**Can I delete a staff member and their attendance history?**
You can *disable* a staff member — the safe, reversible, audited route that preserves every record. ChronoSwift deliberately has no hard delete, because in payroll and HR disputes deletion is nearly always wrong.

**What is "multi-tenant" and why does it matter to me as a client?**
ChronoSwift runs one deployment to serve many customer companies, but data isolation is absolute: your staff, your QR codes, your records, and your settings are yours and yours alone — not shared, not leaked, not visible to anyone else. Tenant boundaries are enforced at the application and query layers, not just hidden in the UI.

**What happens if a subscription/relationship is interrupted?**
Suspended organizations are locked out of sign-in but their data remains intact and re-activatable. Nothing is destroyed during suspension.

**How is this faster than a paper register?**
The paper register is transcribed by a human into a spreadsheet at month-end, with all the energy of transcription and the rounding generosity of whoever's handwriting it is. ChronoSwift produces payroll-ready, dispute-proof records in real time, forever.

---

## 12. Technical Appendix

For technical teams evaluating or deploying the platform, here is how the system is actually built.

- **Stack:** Next.js 14 (App Router) + TypeScript, MongoDB (Mongoose 8, Atlas-ready), Tailwind CSS, Zod validation, bcryptjs, jose (JWT), node-mailjet, qrcode, date-fns-tz. Deploys to Vercel (or any Node host) with MongoDB Atlas; no special infrastructure required.
- **Sessions:** HS256-signed JWT in an HTTP-only, Secure (production), SameSite=Lax cookie (`chrono_session`), 7-day expiry. Identity, org ID, and role always resolved server-side from the session — client-supplied values are never trusted for authorization.
- **Password/token hashing:** bcrypt (cost 12) for passwords; SHA-256 for every one-time token (invites, resets, QR codes). Raw tokens are shown/emailed exactly once and never persisted.
- **Tenant model:** single `users` collection with roles `SUPER_ADMIN | ORGANIZATION_ADMIN | STAFF`; organizations embed their attendance settings; attendance records, QR locations, and invitations all carry `organizationId`. Compound unique indexes enforce **one attendance record per (org, staff, date)** and **unique employee IDs per org** at the database level.
- **Middleware & guards:** Next middleware enforces the session cookie and role→route mapping (`/super-admin/*`, `/dashboard/*`, `/staff/*`), preserves redirect targets through login (including QR tokens), and always allows the public pages. Server pages and API routes re-check authorization independently; `assertOrgAccess` enforces tenant boundaries; suspended orgs and disabled/pending users are blocked login- and clock-side.
- **Rate limits (token bucket):** login 10/min/IP; forgot-password 5/h/IP (silent, non-enumerable); clock 20/min/user; staff invites 30/h/org; resend 20/h/org; QR create/rotate 20/h/org; scan page 120/min/IP. In-memory per instance by design; plug Upstash Redis for cluster-wide limiting.
- **Time rules:** records store UTC instants plus a `YYYY-MM-DD` date key derived in the org's timezone; statuses computed from `workStart + graceMinutes`, `workEnd − 15 min` early threshold, and the 240-minute half-day threshold; rules applied per-day from the org's working-days calendar and never applied retroactively to old records.
- **Audit log:** append-only collection (`createdAt` only), written fire-and-forget so it can never break the user flow; indexed per org for fast feeds; readable-only via API.
- **Data integrity helpers:** race-safe duplicate clock-ins (unique index + friendly conflict response), best-effort rollback on multi-record creation failures, regex-escaped server-side search and pagination everywhere.
- **Email:** one central sender abstraction over Mailjet; branded templates for org-admin invitation, staff invite, welcome, and password reset. Unconfigured mail transport degrades gracefully to on-screen setup links plus an audit note — onboarding never stalls.
- **Testing:** Vitest suites for attendance-rule boundaries (grace/late/early/half-day), token hashing, input schemas, rate limiting, redirect sanitization, middleware public-path rules, plus real-Mongo integration suites covering the full invite → accept → scan → clock flow and their guard rails.
- **Ops niceties:** idempotent seed script (`npm run seed`) for demo tenants; tenant-listing and email-test helper scripts; health settings surfaced in UI when `APP_URL` is misconfigured (QR prints would point at the wrong domain otherwise).

---

*ChronoSwift — Smart attendance. Simple management.*
