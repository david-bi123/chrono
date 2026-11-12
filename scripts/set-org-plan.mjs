// Scoped plan assignment for ONE organization. Dry-run by default.
//
//   node scripts/set-org-plan.mjs --org "SamTech Labs" --plan BUSINESS --exempt
//   node scripts/set-org-plan.mjs --org "SamTech Labs" --plan BUSINESS --exempt --confirm
//
// Rules:
//   * Exactly one organization must match, otherwise the script refuses.
//   * Nothing is written unless --confirm is passed.
//   * Only that single document is touched (no collection-wide updates).
//   * The change is recorded in subscriptionevents + auditlogs like the console.
//   * Prints the database name, never the connection string.
import fs from "node:fs";
import mongoose from "mongoose";

const PLAN_IDS = ["STARTER", "GROWTH", "BUSINESS"];
const STATUSES = ["ACTIVE", "PAST_DUE", "SUSPENDED", "CANCELLED"];

const argv = process.argv.slice(2);
const has = (name) => argv.includes(`--${name}`);
const arg = (name) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? undefined : argv[i + 1];
};

const selector = arg("org");
const plan = arg("plan")?.toUpperCase();
const status = arg("status")?.toUpperCase();
const periodEnd = arg("period-end");
const note = arg("note");
const exempt = has("exempt") ? true : has("no-exempt") ? false : undefined;
const confirm = has("confirm");

const fail = (message) => {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
};

if (!selector) fail('Missing --org "<name|slug|objectId>". Nothing was changed.');
if (!plan || !PLAN_IDS.includes(plan)) fail(`--plan must be one of ${PLAN_IDS.join(", ")}. Nothing was changed.`);
if (status && !STATUSES.includes(status)) fail(`--status must be one of ${STATUSES.join(", ")}. Nothing was changed.`);

let periodEndDate = null;
if (periodEnd) {
  periodEndDate = new Date(`${periodEnd}T00:00:00.000Z`);
  if (Number.isNaN(periodEndDate.getTime())) fail(`--period-end "${periodEnd}" is not a valid YYYY-MM-DD date.`);
}

const uri = fs
  .readFileSync(".env.local", "utf8")
  .split(/\r?\n/)
  .find((l) => /^MONGODB_URI=/.test(l))
  ?.slice("MONGODB_URI=".length)
  .trim();

if (!uri) fail("MONGODB_URI not found in .env.local");

await mongoose.connect(uri, { serverSelectionTimeoutMS: 20000 });
const db = mongoose.connection.db;
const orgs = db.collection("organizations");
const events = db.collection("subscriptionevents");
const audit = db.collection("auditlogs");

console.log("=== SET ORGANIZATION PLAN (scoped, one document) ===");
console.log(`database : ${db.databaseName}`);
console.log(`selector : "${selector}"`);
console.log(`writes   : ${confirm ? "ENABLED (--confirm)" : "disabled (dry run)"}`);

// ---- resolve exactly one organization -------------------------------------
const filters = [];
if (/^[a-f0-9]{24}$/i.test(selector)) filters.push({ _id: new mongoose.Types.ObjectId(selector) });
filters.push({ slug: selector.toLowerCase().trim() });
filters.push({ name: selector.trim() });
filters.push({ name: { $regex: `^${selector.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } });

const seen = new Map();
for (const filter of filters) {
  const rows = await orgs.find(filter, { projection: { name: 1, slug: 1, plan: 1, subscriptionStatus: 1, billingExempt: 1, currentPeriodEnd: 1 } }).toArray();
  for (const row of rows) seen.set(String(row._id), row);
}

if (seen.size === 0) fail(`No organization matches "${selector}". Nothing was changed.`);
if (seen.size > 1) {
  console.error("\n✗ Selector is ambiguous — it matched more than one organization:");
  for (const row of seen.values()) console.error(`    ${row._id}  ${row.name}  (${row.slug})`);
  fail("Use the exact slug or ObjectId. Nothing was changed.");
}

const org = [...seen.values()][0];
const fromPlan = org.plan ?? "STARTER";
// Raw value matters: documents created before the subscription fields existed
// have no subscriptionStatus at all. The app normalizes that to ACTIVE, but the
// script should still write it explicitly so the console shows the real state.
const rawStatus = org.subscriptionStatus ?? null;
const fromStatus = rawStatus ?? "ACTIVE";

const patch = {
  plan,
  planStartedAt: plan === fromPlan ? undefined : new Date(),
  updatedAt: new Date(),
};
if (status) patch.subscriptionStatus = status;
if (exempt !== undefined) patch.billingExempt = exempt;
if (periodEndDate) patch.currentPeriodEnd = periodEndDate;
for (const key of Object.keys(patch)) if (patch[key] === undefined) delete patch[key];

console.log("\ntarget organization:");
console.log(`  ${org.name}  (${org.slug})  ${org._id}`);
console.log("\ncurrent:");
console.log(`  plan                ${fromPlan}`);
console.log(`  subscriptionStatus  ${rawStatus ?? "— (normalized to ACTIVE)"}`);
console.log(`  billingExempt       ${org.billingExempt ? "yes" : "no"}`);
console.log(`  currentPeriodEnd    ${org.currentPeriodEnd ? org.currentPeriodEnd.toISOString().slice(0, 10) : "—"}`);
console.log("\nproposed:");
console.log(`  plan                ${plan}${plan === fromPlan ? " (unchanged)" : ""}`);
console.log(`  subscriptionStatus  ${status ?? fromStatus}${status ? "" : " (unchanged)"}`);
console.log(`  billingExempt       ${exempt === undefined ? (org.billingExempt ? "yes" : "no") : exempt ? "yes" : "no"}${exempt === undefined ? " (unchanged)" : ""}`);
console.log(`  currentPeriodEnd    ${periodEndDate ? periodEndDate.toISOString().slice(0, 10) : org.currentPeriodEnd ? `${org.currentPeriodEnd.toISOString().slice(0, 10)} (unchanged)` : "—"}`);
if (note) console.log(`  note                ${note}`);

const changed = [];
if (plan !== fromPlan) changed.push({ type: "PLAN_CHANGED", fromPlan, toPlan: plan });
if (status && status !== fromStatus) changed.push({ type: "STATUS_CHANGED", fromPlan, toPlan: plan, fromStatus, toStatus: status });
if (exempt !== undefined && exempt !== Boolean(org.billingExempt))
  changed.push({ type: "STATUS_CHANGED", fromPlan, toPlan: plan, fromStatus, toStatus: status ?? fromStatus });
if (periodEndDate) changed.push({ type: "PERIOD_EXTENDED", fromPlan, toPlan: plan });

if (!confirm) {
  console.log("\nDry run — nothing was written. Re-run with --confirm to apply.\n");
  await mongoose.disconnect();
  process.exit(0);
}

// ---- apply ----------------------------------------------------------------
const result = await orgs.updateOne({ _id: org._id }, { $set: patch });
if (result.matchedCount !== 1) fail("Expected to match exactly one organization; nothing reliable happened.");

const now = new Date();
if (changed.length === 0) {
  await events.insertOne({
    organizationId: org._id,
    type: fromPlan === plan ? "PLAN_ASSIGNED" : "PLAN_CHANGED",
    fromPlan,
    toPlan: plan,
    fromStatus,
    toStatus: status ?? fromStatus,
    actorId: null,
    note: note || "Re-applied by scripts/set-org-plan.mjs",
    metadata: { source: "script", billingExempt: exempt },
    createdAt: now,
    updatedAt: now,
  });
} else {
  for (const event of changed) {
    await events.insertOne({
      organizationId: org._id,
      type: event.type,
      fromPlan: event.fromPlan,
      toPlan: event.toPlan,
      fromStatus: event.fromStatus ?? null,
      toStatus: event.toStatus ?? null,
      actorId: null,
      note: note || "Applied by scripts/set-org-plan.mjs",
      metadata: { source: "script", billingExempt: exempt },
      createdAt: now,
      updatedAt: now,
    });
  }
}

await audit.insertOne({
  organizationId: org._id,
  actorId: null,
  action: "subscription.plan.assigned_by_script",
  targetType: "Organization",
  targetId: String(org._id),
  metadata: { fromPlan, toPlan: plan, fromStatus, toStatus: status ?? fromStatus, billingExempt: exempt, note: note ?? null },
  ipAddress: "local-script",
  userAgent: "scripts/set-org-plan.mjs",
  createdAt: now,
});

const after = await orgs.findOne({ _id: org._id }, { projection: { plan: 1, subscriptionStatus: 1, billingExempt: 1, currentPeriodEnd: 1 } });
console.log("\n✓ applied:");
console.log(`  plan                ${after.plan}`);
console.log(`  subscriptionStatus  ${after.subscriptionStatus}`);
console.log(`  billingExempt       ${after.billingExempt ? "yes" : "no"}`);
console.log(`  currentPeriodEnd    ${after.currentPeriodEnd ? after.currentPeriodEnd.toISOString().slice(0, 10) : "—"}`);
console.log(`  events written      ${changed.length || 1}`);

await mongoose.disconnect();
console.log("\n(done — one organization updated, connection closed)\n");
