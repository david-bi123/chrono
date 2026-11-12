// PERMISSION PROBE — deliberately does NOT touch the real "chrono" database.
// It connects to the SAME cluster with the SAME credentials but a throwaway
// database name, then reports exactly which destructive actions those
// credentials are allowed to perform. Considered "diagnostic", safe.
import fs from "node:fs";
import mongoose from "mongoose";

const uri = fs
  .readFileSync(".env.local", "utf8")
  .split(/\r?\n/)
  .find((l) => /^MONGODB_URI=/.test(l))?.slice("MONGODB_URI=".length).trim();
if (!uri) { console.error("MONGODB_URI not found"); process.exit(1); }

const probeDb = `__guard_probe_${Date.now().toString(36)}`;
const probeUri = uri.replace(/\/[^/?]*(\?|$)/, `/${probeDb}$1`);
const redacted = probeUri.replace(/(?<=:\/\/)[^@/]*@/, "<credentials>@");
console.log(`Probe database (throwaway): ${probeDb}`);

await mongoose.connect(probeUri, { serverSelectionTimeoutMS: 20000 });
const db = mongoose.connection.db;
const Verdict = { GRANTED: "CAN DO (dangerous)", DENIED: "blocked (protected)" };

const results = {};

// 1. Ordinary write — the app needs this; expected GRANTED.
try {
  await db.collection("_probe").insertOne({ probe: true, at: new Date() });
  results["insert (write a document)"] = "allowed (needed by the app)";
} catch { results["insert (write a document)"] = "denied"; }

// 2. Delete the probe document — scoped deletes are what the app legitimately needs.
try {
  await db.collection("_probe").deleteOne({ probe: true });
  results["deleteOne (delete scoped documents)"] = "allowed (needed by the app)";
} catch { results["deleteOne (delete scoped documents)"] = "denied"; }

// 3. Create a collection.
try {
  await db.createCollection("_probe_coll");
  results["createCollection"] = "allowed (needed by the app)";
} catch { results["createCollection"] = "denied"; }

// 4. Drop a collection — agents/scripts must NOT be able to do this to chrono's data.
try {
  await db.command({ drop: "_probe_coll" });
  results["DROP COLLECTION"] = Verdict.GRANTED;
} catch (e) {
  results["DROP COLLECTION"] = (e?.code === 13 || /not authorized/i.test(String(e?.message))) ? Verdict.DENIED : e?.codeName || e?.name;
}

// 5. Drop the entire DATABASE — the "wipe everything" action.
try {
  await db.command({ dropDatabase: 1 });
  results["DROP DATABASE"] = Verdict.GRANTED;
} catch (e) {
  results["DROP DATABASE"] = (e?.code === 13 || /not authorized/i.test(String(e?.message))) ? Verdict.DENIED : e?.codeName || e?.name;
}

console.log("\n=== WHAT THE APP'S CURRENT CREDENTIALS CAN DO ===");
for (const [k, v] of Object.entries(results)) console.log(`  ${k.padEnd(46)} ${v}`);
console.log("\n(Probe database has no lingering data; a denied dropDatabase leaves it harmless.)");
await mongoose.disconnect();
console.log("done.");
