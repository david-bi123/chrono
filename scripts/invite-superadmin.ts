/**
 * Bootstrap: invite the FIRST super admin by email.
 *
 * Run:  npx tsx scripts/invite-superadmin.ts <email> "First Last"
 *
 * What it does:
 *  1. Creates (or reuses) a SUPER_ADMIN user with status PENDING — no password.
 *  2. Mints a single-use setup token valid for 72 hours.
 *  3. Emails a secure setup link (accept-invitation page) so the owner creates
 *     their own password. The raw token is only printed as a fallback if the
 *     email could not be delivered.
 *
 * Safe to re-run: an already-ACTIVE admin aborts; a stale PENDING invite is
 * replaced. Reads MONGODB_URI from .env.local — the SAME database the Vercel
 * deployment uses (verify env parity before clicking the link).
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
import { Invitation } from "../models/Invitation";
import { AuditLog } from "../models/AuditLog";
import { generateRawToken, hashToken } from "../lib/auth/tokens";
import { sendSuperAdminInvitation } from "../lib/email/mailjet";

const EXPIRY_HOURS = 72;
const SETUP_PATH = "/accept-invitation?token=";

async function main() {
  const email = (process.argv[2] || process.env.SUPERADMIN_EMAIL || "").toLowerCase().trim();
  const rawName = (process.argv[3] || "Super Admin").trim();
  const [firstName, ...rest] = rawName.split(/\s+/);
  const lastName = rest.join(" ") || "Admin";

  if (!email || !email.includes("@")) {
    console.error("Usage: npx tsx scripts/invite-superadmin.ts <email> \"First Last\"");
    process.exit(1);
  }
  const appUrl = (process.env.APP_URL || "").replace(/\/$/, "");
  if (!appUrl || appUrl.includes("localhost")) {
    console.error(`Refusing to run: APP_URL must be the production URL, got "${appUrl}".`);
    console.error("Set APP_URL in .env.local to https://chronoswift.vercel.app first.");
    process.exit(1);
  }
  if (!process.env.MAILJET_API_KEY || !process.env.MAILJET_SECRET_KEY || !process.env.MAIL_FROM_EMAIL) {
    console.error("Mailjet is not configured locally (MAILJET_API_KEY / SECRET / MAIL_FROM_EMAIL).");
    process.exit(1);
  }

  await dbConnect();

  // User
  let user = await User.findOne({ email }).select("+passwordHash");
  if (user?.status === "ACTIVE" && user.passwordHash) {
    console.error(`A user with ${email} already exists and is active. Nothing to do.`);
    process.exit(1);
  }
  if (!user) {
    user = await User.create({
      organizationId: null,
      role: "SUPER_ADMIN",
      firstName,
      lastName,
      email,
      status: "PENDING",
    });
    console.log(`Created pending SUPER_ADMIN user for ${email}.`);
  } else {
    console.log(`Reusing existing PENDING user for ${email}.`);
  }

  // Replace any stale SUPER_ADMIN invite, then mint a fresh single-use token.
  await Invitation.deleteMany({ userId: user._id, type: "SUPER_ADMIN", usedAt: null });
  const raw = generateRawToken(24);
  const expiresAt = new Date(Date.now() + EXPIRY_HOURS * 3600_000);
  await Invitation.create({
    organizationId: null,
    email,
    userId: user._id,
    tokenHash: hashToken(raw),
    type: "SUPER_ADMIN",
    expiresAt,
  });
  const link = `${appUrl}${SETUP_PATH}${raw}`;

  // Email the setup link.
  const expiresNote = `This link expires on ${expiresAt.toISOString().slice(0, 16).replace("T", " ")} UTC and can be used once.`;
  const result = await sendSuperAdminInvitation({
    to: email,
    ownerName: firstName,
    link,
    expiresNote,
  });

  if (result.skipped) {
    console.log("EMAIL SKIPPED (no Mailjet keys at runtime). Fallback — deliver this link by hand:");
    console.log(link);
  } else {
    console.log(`Setup email sent to ${email}. Ask them to check Spam/Promotions if it's missing.`);
    console.log("The link is NOT printed in the terminal — it lives only in the email.");
  }

  await AuditLog.create({
    organizationId: null,
    actorId: user._id,
    action: "SUPER_ADMIN_INVITED",
    targetId: String(user._id),
    metadata: { email, invitedAt: new Date().toISOString() },
  });

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
