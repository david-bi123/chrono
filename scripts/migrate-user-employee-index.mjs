// Migrate users.employeeId uniqueness from sparse to partial.
//
//   node scripts/migrate-user-employee-index.mjs            # inspect only
//   node scripts/migrate-user-employee-index.mjs --confirm  # drop + recreate
//
// Why: the old index { organizationId: 1, employeeId: 1 } unique + sparse only
// skips documents where employeeId is *absent*. Admins and managers store
// employeeId = null, so a second such user in one organization collides.
// The partial index ({ employeeId: { $type: "string" } }) ignores null too.
//
// Rules:
//   * Read-only unless --confirm is passed.
//   * Only drops the one legacy index on the users collection.
//   * Aborts if the data already contains duplicates the new index would reject.
//   * Prints the database name, never the connection string.
import fs from "node:fs";
import mongoose from "mongoose";

const LEGACY_KEY = { organizationId: 1, employeeId: 1 };
const INDEX_NAME = "organizationId_1_employeeId_1";
const PARTIAL = { employeeId: { $type: "string" } };

const confirm = process.argv.includes("--confirm");
const fail = (message) => {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
};

const uri = fs
  .readFileSync(".env.local", "utf8")
  .split(/\r?\n/)
  .find((l) => /^MONGODB_URI=/.test(l))
  ?.slice("MONGODB_URI=".length)
  .trim();

if (!uri) fail("MONGODB_URI not found in .env.local");

await mongoose.connect(uri, { serverSelectionTimeoutMS: 20000 });
const db = mongoose.connection.db;
const users = db.collection("users");

console.log("=== USERS EMPLOYEE-ID INDEX MIGRATION ===");
console.log(`database : ${db.databaseName}`);
console.log(`writes   : ${confirm ? "ENABLED (--confirm)" : "disabled (inspect only)"}\n`);

const indexes = await users.indexes();
console.log("current indexes on users:");
for (const index of indexes) {
  const flags = [
    index.unique ? "unique" : null,
    index.sparse ? "sparse" : null,
    index.partialFilterExpression ? `partial(${JSON.stringify(index.partialFilterExpression)})` : null,
  ]
    .filter(Boolean)
    .join(" ");
  console.log(`  ${index.name.padEnd(38)} ${JSON.stringify(index.key)} ${flags}`);
}

const legacy = indexes.find(
  (i) =>
    i.name === INDEX_NAME &&
    i.unique &&
    !i.partialFilterExpression &&
    JSON.stringify(i.key) === JSON.stringify(LEGACY_KEY)
);

const compliant = indexes.find(
  (i) =>
    i.unique &&
    i.partialFilterExpression &&
    JSON.stringify(i.key) === JSON.stringify(LEGACY_KEY) &&
    JSON.stringify(i.partialFilterExpression) === JSON.stringify(PARTIAL)
);

const existingKeyIndex = indexes.find(
  (i) => i.name === INDEX_NAME && JSON.stringify(i.key) === JSON.stringify(LEGACY_KEY)
);

// ---- pre-flight -----------------------------------------------------------
const total = await users.countDocuments();
const withEmployeeId = await users.countDocuments({ employeeId: { $type: "string" } });
const withoutEmployeeId = total - withEmployeeId;

const duplicates = await users
  .aggregate([
    { $match: { employeeId: { $type: "string" } } },
    { $group: { _id: { organizationId: "$organizationId", employeeId: "$employeeId" }, n: { $sum: 1 } } },
    { $match: { n: { $gt: 1 } } },
  ])
  .toArray();

console.log("\ndata:");
console.log(`  users total                      ${total}`);
console.log(`  with a string employeeId         ${withEmployeeId}`);
console.log(`  without (null/absent)            ${withoutEmployeeId}`);
console.log(`  duplicate (org, employeeId)      ${duplicates.length}`);
for (const d of duplicates.slice(0, 10)) {
  console.log(`    org=${d._id.organizationId} employeeId="${d._id.employeeId}" count=${d.n}`);
}

if (compliant) {
  console.log("\n✓ The partial unique index already exists. Nothing to do.\n");
  await mongoose.disconnect();
  process.exit(0);
}

if (duplicates.length > 0) {
  fail("Duplicate employeeId values exist in one organization. Resolve them before migrating.");
}

if (!legacy && !existingKeyIndex) {
  console.log("\nNo legacy employeeId index found. A fresh creation is safe:");
  console.log(`  createIndex(${JSON.stringify(LEGACY_KEY)}, { unique: true, partialFilterExpression: ${JSON.stringify(PARTIAL)} })`);
  if (!confirm) {
    console.log("\nInspect only — nothing was written. Re-run with --confirm to create it.\n");
    await mongoose.disconnect();
    process.exit(0);
  }
  await users.createIndex(LEGACY_KEY, { name: INDEX_NAME, unique: true, partialFilterExpression: PARTIAL });
  console.log("\n✓ partial unique index created.\n");
  await mongoose.disconnect();
  process.exit(0);
}

console.log("\nplan:");
console.log(`  1. dropIndex("${INDEX_NAME}")`);
console.log(`  2. createIndex(${JSON.stringify(LEGACY_KEY)}, { unique: true, partialFilterExpression: ${JSON.stringify(PARTIAL)} })`);

if (!confirm) {
  console.log("\nInspect only — nothing was written. Re-run with --confirm to apply.\n");
  await mongoose.disconnect();
  process.exit(0);
}

// ---- apply ----------------------------------------------------------------
try {
  await users.dropIndex(INDEX_NAME);
  console.log(`\n✓ dropped ${INDEX_NAME}`);
} catch (error) {
  fail(`Could not drop ${INDEX_NAME}: ${error.message}`);
}

try {
  await users.createIndex(LEGACY_KEY, { name: INDEX_NAME, unique: true, partialFilterExpression: PARTIAL });
  console.log(`✓ created ${INDEX_NAME} with partial filter ${JSON.stringify(PARTIAL)}`);
} catch (error) {
  // Restore the previous state rather than leaving the collection unindexed.
  console.error(`\n✗ createIndex failed: ${error.message}`);
  console.error("  restoring the legacy index…");
  await users.createIndex(LEGACY_KEY, { name: INDEX_NAME, unique: true, sparse: true }).catch((e) => {
    console.error(`  ✗ restore also failed: ${e.message}`);
  });
  fail("Migration failed — collection restored to the legacy index.");
}

const after = await users.indexes();
console.log("\nindexes after:");
for (const index of after) {
  console.log(`  ${index.name.padEnd(38)} ${JSON.stringify(index.key)} ${index.unique ? "unique" : ""} ${index.partialFilterExpression ? "partial" : ""}`);
}

await mongoose.disconnect();
console.log("\n(done — users index migrated, connection closed)\n");
