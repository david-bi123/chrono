// READ-ONLY production DB audit — prints no secrets (URI, hashes, tokens).
// Run: node scripts/db-audit.mjs
import fs from "node:fs";
import mongoose from "mongoose";

const TARGET_EMAIL = "samueldagbo50@gmail.com";

const uri = fs
  .readFileSync(".env.local", "utf8")
  .split(/\r?\n/)
  .find((l) => /^MONGODB_URI=/.test(l))?.slice("MONGODB_URI=".length)
  .trim();

if (!uri) {
  console.error("MONGODB_URI not found in .env.local");
  process.exit(1);
}

await mongoose.connect(uri, { serverSelectionTimeoutMS: 20000 });
const db = mongoose.connection.db;
const users = db.collection("users");
const orgs = db.collection("organizations");
const invs = db.collection("invitations");
const logs = db.collection("auditlogs");

console.log("=== DATABASE (read-only audit) ===");

const orgCount = await orgs.countDocuments({});
console.log(`\nORGANIZATIONS: ${orgCount}`);
const orgList = await orgs
  .find({}, { projection: { name: 1, slug: 1, status: 1, createdAt: 1 } })
  .sort({ createdAt: -1 })
  .toArray();
for (const o of orgList) {
  const adminCount = await users.countDocuments({ organizationId: o._id, role: "ORGANIZATION_ADMIN" });
  const staffCount = await users.countDocuments({ organizationId: o._id, role: "STAFF" });
  console.log(
    `  - ${o.name} (${o.slug}) status=${o.status} created=${o.createdAt?.toISOString?.().slice(0, 10)} admins=${adminCount} staff=${staffCount}`
  );
}

const totalUsers = await users.countDocuments({});
const byRole = await users.aggregate([{ $group: { _id: "$role", n: { $sum: 1 } } }]).toArray();
const byStatus = await users.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]).toArray();
console.log(`\nUSERS: total=${totalUsers}`);
console.log(`  by role:   ${byRole.map((r) => `${r._id}=${r.n}`).join(", ")}`);
console.log(`  by status: ${byStatus.map((r) => `${r._id}=${r.n}`).join(", ")}`);

console.log(`\n=== ACCOUNT LOOKUP: ${TARGET_EMAIL} ===`);
const email = TARGET_EMAIL.toLowerCase().trim();
const user = await users.findOne(
  { email },
  { projection: { passwordHash: 1, role: 1, status: 1, organizationId: 1, firstName: 1, lastName: 1, employeeId: 1, lastLoginAt: 1, createdAt: 1, updatedAt: 1 } }
);
if (!user) {
  console.log("  NOT FOUND — no user document with this email");
} else {
  const org = user.organizationId ? await orgs.findOne({ _id: user.organizationId }, { projection: { name: 1, status: 1 } }) : null;
  console.log(`  name:         ${user.firstName} ${user.lastName}`);
  console.log(`  role:         ${user.role}`);
  console.log(`  status:       ${user.status}`);
  console.log(`  password set: ${user.passwordHash ? `yes (${String(user.passwordHash).slice(0, 4)}… scheme)` : "NO — user cannot log in until setup"}`);
  console.log(`  organization: ${org ? `${org.name} (org status: ${org.status})` : "none"}`);
  console.log(`  last login:   ${user.lastLoginAt ? user.lastLoginAt.toISOString() : "never"}`);
  console.log(`  created:      ${user.createdAt?.toISOString?.().slice(0, 10)}`);
}

console.log(`\n=== INVITATIONS / RESET TOKENS for ${email} ===`);
const invList = await invs.find({ email }, { projection: { type: 1, expiresAt: 1, usedAt: 1, createdAt: 1 } }).sort({ createdAt: -1 }).limit(10).toArray();
if (!invList.length) console.log("  none");
for (const i of invList) {
  console.log(
    `  - ${i.type} created=${i.createdAt?.toISOString?.().slice(0, 16)} expires=${i.expiresAt?.toISOString?.().slice(0, 16)} used=${i.usedAt ? i.usedAt.toISOString().slice(0, 16) : "no"}`
  );
}

console.log("\n=== ALL USERS (account inventory) ===");
const allUsers = await users
  .find({}, { projection: { email: 1, role: 1, status: 1, organizationId: 1, passwordHash: 1, lastLoginAt: 1 } })
  .sort({ createdAt: 1 })
  .toArray();
for (const u of allUsers) {
  const org = u.organizationId ? await orgs.findOne({ _id: u.organizationId }, { projection: { name: 1 } }) : null;
  console.log(
    `  - ${u.email.toString().padEnd(34)} ${u.role.padEnd(20)} ${u.status.padEnd(8)} pw=${u.passwordHash ? "Y" : "N"}  org=${org ? org.name : "-"}  lastLogin=${u.lastLoginAt ? u.lastLoginAt.toISOString().slice(0, 16) : "never"}`
  );
}

console.log("\n=== RECENT AUTH-RELATED AUDIT LOGS (last 15) ===");
const audit = await logs
  .find({ action: /login|auth|invitation|password|setup/i }, { projection: { action: 1, createdAt: 1, ipAddress: 1, metadata: 1 } })
  .sort({ createdAt: -1 })
  .limit(15)
  .toArray();
if (!audit.length) console.log("  none matching /login|auth|invitation|password|setup/i");
for (const a of audit) {
  console.log(`  - ${a.createdAt?.toISOString?.().slice(0, 16)}  ${a.action}  ${a.ipAddress || "-"}  ${JSON.stringify(a.metadata || {}).slice(0, 100)}`);
}

await mongoose.disconnect();
console.log("\n(done — connection closed, read-only)");
