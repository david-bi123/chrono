import fs from "fs";
import path from "path";
for (const f of [".env.local", "env.local"]) {
  const p = path.join(process.cwd(), f);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!process.env[m[1]]) process.env[m[1]] = v;
  }
}
import { dbConnect } from "../lib/db/mongoose";
import { User } from "../models/User";
import { Organization } from "../models/Organization";
import { AttendanceLocation } from "../models/AttendanceLocation";

async function main() {
  await dbConnect();
  const orgs = await Organization.find().sort({ createdAt: 1 }).lean();
  console.log(`ORGS:${orgs.length}`);
  for (const o of orgs) {
    const r = o as unknown as Record<string, unknown>;
    console.log(`ORG|${r._id}|${r.name}|${r.email}|${r.status}`);
  }
  const users = await User.find().select("email role status organizationId firstName lastName employeeId department").sort({ role: 1, email: 1 }).lean();
  console.log(`USERS:${users.length}`);
  for (const u of users) {
    const r = u as unknown as Record<string, unknown>;
    console.log(`USER|${r.email}|${r.role}|${r.status}|org=${r.organizationId}|${r.firstName} ${r.lastName}|eid=${r.employeeId || "-"}|dept=${r.department || "-"}`);
  }
  const locs = await AttendanceLocation.find().select("name status organizationId").lean();
  console.log(`LOCS:${locs.length}`);
  for (const l of locs) {
    const r = l as unknown as Record<string, unknown>;
    console.log(`LOC|${r.name}|${r.status}|org=${r.organizationId}`);
  }
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
