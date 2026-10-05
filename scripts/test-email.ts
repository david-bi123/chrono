import fs from "fs";
import path from "path";
import { sendStaffInvitation } from "../lib/email/mailjet";

function loadEnvFile() {
  for (const f of [".env.local", "env.local"]) {
    const p = path.join(process.cwd(), f);
    if (!fs.existsSync(p)) continue;
    const lines = fs.readFileSync(p, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const m = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const k = m[1];
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      if (!process.env[k]) process.env[k] = v;
    }
  }
}
loadEnvFile();

async function main() {
  const to = process.argv[2] || "samueldagbo50@gmail.com";
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  const res = await sendStaffInvitation({
    to,
    orgName: "Acme Technologies",
    staffName: "Samuel",
    link: `${appUrl}/accept-invitation?token=preview-demo-token`,
    expiresNote: "This invitation expires in 72 hours and can only be used once. (Preview — demo link, not valid.)",
  });
  console.log("branded preview sent:", res);
}

main().catch((e) => {
  console.error("SEND FAILED:", e?.message || e);
  process.exit(1);
});
