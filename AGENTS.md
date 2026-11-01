# AGENTS.md — working rules for AI agents and automation on this repo

This repo is a multi-tenant staff-attendance SaaS with REAL user data. These
rules are mandatory, not suggestions. Humans reap consequences; agents move on.

## Database — the hard rules

- Production database: host `projects.pfyfg80.mongodb.net`, database `chrono`.
  The connection string lives in `.env.local` and is a SECRET — never print,
  paste, commit or transmit it.
- **NEVER** issue destructive statements against production, no matter how
  reasonable it seems at the time: `dropDatabase`, `dropCollection`,
  `deleteMany({})` / empty-filter bulk removals, unconditional `updateMany`
  overwrites of collections, or "cleanup" of any collection you did not create
  in that session.
- Agents must ask the human and get an explicit yes in chat before ANY write
  to production that isn't going through the app's normal API flows.
- Tests never touch production, ever. The harness enforces this
  (`guardTestUri` in `tests/helpers/integration.ts`) and unit-test wipes live
  only in throwaway databases (`mongodb://127.0.0.1:27017` or
  `MONGODB_TEST_URI`).
- The demo seed (`npm run seed`) is guarded against production. Demo data does
  not belong with real attendance records.

## Reading, not writing, is nearly always the answer

- To inspect the DB: `node scripts/db-audit.mjs` — deliberately read-only.
- To test what credentials can do: `node scripts/db-permission-probe.mjs` —
  probes against a throwaway database only.
- New scripts must be written in this style: read-only by default, scoped
  writes only (never collection-wide), and refuse production for anything
  destructive.

## Code integrity

- Auth, tenancy and attendance logic is covered by integration tests. Run
  `npx tsc --noEmit`, `npm run lint` and `npm test` before pushing. Never push
  with tests failing; never lower a test bar to make a suite pass quietly.
- Keep `.env.local` untracked. Only inspect env KEYS, never output values.
- Windows PowerShell quirks: prefer the edit/write tools over `Set-Content`
  (BOM issues); build alone (memory pressure can crash the worker).

## Honesty

- Don't fabricate product claims, metrics, or data. Don't present planned
  features as existing. If something failed, say so with the error.
