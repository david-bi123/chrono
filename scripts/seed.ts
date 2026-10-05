/**
 * Dev seed: super admin + demo org + admin + 5 staff + attendance.
 * Run: npm run seed
 * NEVER run against production.
 */
import fs from "fs";
import path from "path";
import mongoose from "mongoose";

// Load .env.local / env.local for tsx (Next loads these automatically, plain node does not)
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
import { Attendance } from "../models/Attendance";
import { AttendanceLocation } from "../models/AttendanceLocation";
import { hashPassword } from "../lib/auth/password";
import { generateRawToken, hashToken, generateSlug } from "../lib/auth/tokens";
import { orgTodayKey } from "../lib/attendance/rules";

async function main() {
  await dbConnect();
  console.log("Seeding (dev only)…");

  const superEmail = process.env.SEED_SUPERADMIN_EMAIL || "superadmin@chrono.local";
  const superPw = process.env.SEED_SUPERADMIN_PASSWORD || "ChangeMe123!";
  let sup = await User.findOne({ email: superEmail });
  if (!sup) {
    sup = await User.create({
      organizationId: null,
      role: "SUPER_ADMIN",
      firstName: "Super",
      lastName: "Admin",
      email: superEmail,
      passwordHash: await hashPassword(superPw),
      status: "ACTIVE",
    });
    console.log(`Super admin: ${superEmail} / ${superPw}`);
  }

  let org = await Organization.findOne({ email: "hello@acme.local" });
  if (!org) {
    org = await Organization.create({
      name: "Acme Technologies",
      slug: generateSlug("Acme Technologies"),
      email: "hello@acme.local",
      phone: "+233 30 000 0000",
      address: "Accra, Ghana",
      industry: "Technology",
      timezone: "Africa/Accra",
      status: "ACTIVE",
      attendanceSettings: {
        timezone: "Africa/Accra",
        workStart: "08:00",
        workEnd: "17:00",
        graceMinutes: 15,
        workingDays: [1, 2, 3, 4, 5],
        requireClockOut: true,
      },
    });
  }

  let admin = await User.findOne({ email: "admin@acme.local" });
  if (!admin) {
    admin = await User.create({
      organizationId: org._id,
      role: "ORGANIZATION_ADMIN",
      firstName: "Ama",
      lastName: "Admin",
      email: "admin@acme.local",
      passwordHash: await hashPassword("Admin123!"),
      status: "ACTIVE",
    });
    console.log("Org admin: admin@acme.local / Admin123!");
  }

  const staffData = [
    ["Samuel", "Mensah", "samuel@acme.local", "ACME-001", "Engineering", "Developer"],
    ["Efua", "Owusu", "efua@acme.local", "ACME-002", "Design", "Designer"],
    ["Kwame", "Asante", "kwame@acme.local", "ACME-003", "Operations", "Officer"],
    ["Abena", "Boateng", "abena@acme.local", "ACME-004", "Finance", "Analyst"],
    ["Yaa", "Serwaa", "yaa@acme.local", "ACME-005", "HR", "Coordinator"],
  ];
  for (const [fn, ln, email, eid, dept, pos] of staffData) {
    let u = await User.findOne({ email });
    if (!u) {
      u = await User.create({
        organizationId: org._id,
        role: "STAFF",
        firstName: fn,
        lastName: ln,
        email,
        employeeId: eid,
        department: dept,
        position: pos,
        passwordHash: await hashPassword("Staff123!"),
        status: "ACTIVE",
      });
    }
  }
  console.log("Staff password (all): Staff123!");

  let loc = await AttendanceLocation.findOne({ organizationId: org._id });
  if (!loc) {
    const raw = `chr_${generateRawToken(24)}`;
    loc = await AttendanceLocation.create({
      organizationId: org._id,
      name: "Main Office",
      tokenHash: hashToken(raw),
      status: "ACTIVE",
      createdBy: admin._id,
    });
    console.log(`Demo QR scan URL: ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/attendance/scan/${raw}`);
  }

  // Attendance for last 5 weekdays
  const staff = await User.find({ organizationId: org._id, role: "STAFF" });
  const tz = "Africa/Accra";
  for (let back = 0; back < 5; back++) {
    const day = new Date(Date.now() - back * 86400000);
    const dateKey = orgTodayKey(day, tz);
    for (const s of staff) {
      const exists = await Attendance.findOne({ organizationId: org._id, staffId: s._id, date: dateKey });
      if (exists) continue;
      const late = Math.random() < 0.2;
      const inH = late ? 8 : 7;
      const inM = late ? 20 + Math.floor(Math.random() * 30) : 45 + Math.floor(Math.random() * 15);
      const clockIn = new Date(day);
      clockIn.setHours(inH, inM, 0, 0);
      const clockOut = new Date(day);
      clockOut.setHours(17, Math.floor(Math.random() * 20), 0, 0);
      await Attendance.create({
        organizationId: org._id,
        staffId: s._id,
        locationId: loc._id,
        date: dateKey,
        clockIn,
        clockOut,
        timezone: tz,
        status: late ? "LATE" : "PRESENT",
        totalMinutes: Math.round((clockOut.getTime() - clockIn.getTime()) / 60000),
        source: "QR",
      });
    }
  }
  console.log("Done.");
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
