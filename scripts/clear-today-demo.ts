/**
 * Temp demo prep: remove today's attendance for two staff so they can be
 * clocked in live via the real API for the launch video capture.
 * Dev only. Deletes ONLY today's records for the two named accounts.
 */
import fs from "fs";
import path from "path";
import mongoose from "mongoose";

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
import { Attendance } from "../models/Attendance";
import { Organization } from "../models/Organization";
import { orgTodayKey } from "../lib/attendance/rules";

async function main() {
  await dbConnect();
  const org = await Organization.findOne({ email: "hello@acme.local" });
  if (!org) throw new Error("org not found");
  const tz = org.attendanceSettings?.timezone || "Africa/Accra";
  const dateKey = orgTodayKey(new Date(), tz);
  const targets = await User.find({ organizationId: org._id, email: { $in: ["kwame@acme.local"] } });
  for (const u of targets) {
    const res = await Attendance.deleteOne({ organizationId: org._id, staffId: u._id, date: dateKey });
    console.log(`cleared today for ${u.email}: deleted ${res.deletedCount}`);
  }
  await mongoose.disconnect();
}
main().catch((e) => { console.error(e.message); process.exit(1); });
