import Mailjet from "node-mailjet";

let client: ReturnType<typeof Mailjet.apiConnect> | null = null;

function getClient() {
  const key = process.env.MAILJET_API_KEY;
  const secret = process.env.MAILJET_SECRET_KEY;
  if (!key || !secret) return null;
  if (!client) client = Mailjet.apiConnect(key, secret);
  return client;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.MAILJET_API_KEY && process.env.MAILJET_SECRET_KEY && process.env.MAIL_FROM_EMAIL);
}

interface SendArgs {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail(args: SendArgs): Promise<{ ok: boolean; skipped?: boolean }> {
  const mj = getClient();
  const fromEmail = process.env.MAIL_FROM_EMAIL;
  const fromName = process.env.MAIL_FROM_NAME || "ChronoSwift";
  if (!mj || !fromEmail) {
    console.log(`[email:dev] to=${args.to} subject=${args.subject}\n${args.text}`);
    return { ok: true, skipped: true };
  }
  // Deliverability: explicit Reply-To, List-Unsubscribe, matching text+HTML.
  // NOTE: code alone cannot fix spam placement if SPF/DKIM/DMARC aren't set
  // for the sending domain (see README/email notes). Prefer a custom domain
  // sender (e.g. no-reply@yourdomain.com) authenticated in Mailjet over a
  // @gmail.com From address.
  await mj.post("send", { version: "v3.1" }).request({
    Messages: [
      {
        From: { Email: fromEmail, Name: fromName },
        ReplyTo: { Email: fromEmail, Name: fromName },
        To: [{ Email: args.to, Name: args.toName || args.to }],
        Subject: args.subject,
        TextPart: args.text,
        HTMLPart: args.html,
        // NOTE: Mailjet rejects `X-Mailer` inside the generic Headers collection
        // (400 "Header cannot be customized...") which silently broke every
        // transactional email. Only List-Unsubscribe is allowed here.
        Headers: {
          "List-Unsubscribe": `<mailto:${fromEmail}?subject=unsubscribe>`,
        },
        TrackOpens: "disabled",
        TrackClicks: "disabled",
        CustomCampaign: "chronoswift-transactional",
      },
    ],
  });
  return { ok: true };
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function shell(
  title: string,
  orgName: string,
  bodyHtml: string,
  cta?: { label: string; href: string },
  footer?: string,
  preheader?: string
): string {
  const year = new Date().getFullYear();
  // Table-based, fully inline-styled for Gmail/Outlook. No external CSS.
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head><body style="margin:0;padding:0;background-color:#F1F3F6;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">` +
    `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(preheader || title)} &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F1F3F6;margin:0;padding:0;"><tr><td align="center" style="padding:28px 12px;">` +
    `<!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td><![endif]-->` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;margin:0 auto;">` +
    // Header
    `<tr><td style="background-color:#0B0F19;padding:22px 28px;border-radius:14px 14px 0 0;">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>` +
    `<td align="left" style="font-family:Arial,Helvetica,sans-serif;">` +
    `<div style="font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:bold;color:#FFFFFF;letter-spacing:-0.5px;line-height:28px;"><span style="display:inline-block;background-color:#FFFFFF;color:#0B0F19;width:28px;height:28px;line-height:28px;text-align:center;border-radius:8px;font-size:16px;vertical-align:middle;">&#9719;</span>&nbsp; ChronoSwift</div>` +
    `<div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#9AA4B2;margin-top:6px;line-height:16px;">Smart attendance. Simple management.</div>` +
    `</td></tr></table></td></tr>` +
    // Card
    `<tr><td style="background-color:#FFFFFF;border:1px solid #E3E6EB;border-top:0;padding:30px 28px;border-radius:0 0 14px 14px;">` +
    `<div style="font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:bold;color:#0B0F19;line-height:26px;">${esc(title)}</div>` +
    `<div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#6B7280;margin-top:6px;">${esc(orgName)}</div>` +
    `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#1F2937;line-height:22px;margin-top:18px;">${bodyHtml}</div>` +
    (cta
      ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;"><tr><td align="center" bgcolor="#0B0F19" style="border-radius:8px;"><a href="${esc(cta.href)}" target="_blank" style="display:inline-block;padding:13px 28px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;color:#FFFFFF;text-decoration:none;border-radius:8px;">${esc(cta.label)}</a></td></tr></table>` +
        `<div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#6B7280;margin-top:14px;word-break:break-all;">Trouble with the button? Paste this link into your browser:<br><a href="${esc(cta.href)}" style="color:#0B0F19;">${esc(cta.href)}</a></div>`
      : "") +
    (footer
      ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:22px;"><tr><td style="background-color:#F8FAFC;border:1px solid #E9EDF2;border-radius:8px;padding:12px 14px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#64748B;line-height:18px;">${footer}</td></tr></table>`
      : "") +
    `</td></tr>` +
    `<tr><td align="center" style="padding:18px 8px 4px;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#9AA4B2;line-height:16px;">&copy; ${year} ChronoSwift &middot; Please do not share secure links &middot; This is an automated message</td></tr>` +
    `</table>` +
    `<!--[if mso]></td></tr></table><![endif]-->` +
    `</td></tr></table></body></html>`;
}

export async function sendOrgAdminInvitation(opts: {
  to: string; orgName: string; adminName: string; link: string; expiresNote: string;
}) {
  const subject = `You're invited to administer ${opts.orgName} on ChronoSwift`;
  const body =
    `<p style="margin:0 0 12px;">Hi ${esc(opts.adminName)},</p>` +
    `<p style="margin:0 0 12px;">Your organization <strong>${esc(opts.orgName)}</strong> was created on <strong>ChronoSwift</strong>. You are the organization administrator.</p>` +
    `<p style="margin:0;">Click the button below to create your password and open your dashboard:</p>`;
  const footer = `&#9201; ${esc(opts.expiresNote)}<br><br>&#128274; This link is single-use. No password is included in this email — you will create it yourself on the secure setup page.<br><br>&#128229; Can&apos;t find our emails? Check Spam/Promotions and mark them &quot;Not spam&quot;.`;
  const html = shell("Set up your admin account", opts.orgName, body, { label: "Create password &rarr;", href: opts.link }, footer, subject);
  return sendEmail({ to: opts.to, subject, html, text: `Hi ${opts.adminName},\n\nYour organization ${opts.orgName} was created on ChronoSwift.\n\nCreate your password here (single-use, expires): ${opts.link}\n\n${opts.expiresNote}` });
}

export async function sendStaffInvitation(opts: {
  to: string; orgName: string; staffName: string; link: string; expiresNote: string;
}) {
  const subject = `You're invited to join ${opts.orgName} on ChronoSwift`;
  const body =
    `<p style="margin:0 0 12px;">Hi ${esc(opts.staffName)},</p>` +
    `<p style="margin:0 0 12px;">Welcome to <strong>${esc(opts.orgName)}</strong>! Your team uses <strong>ChronoSwift</strong> to record attendance — just scan the office QR code and tap Clock In.</p>` +
    `<p style="margin:0;">Click the button below to create your password and complete your profile:</p>`;
  const footer = `&#9201; ${esc(opts.expiresNote)}<br><br>&#128274; If you didn't expect this invitation, you can safely ignore this email.<br><br>&#128229; Can&apos;t find our emails? Check Spam/Promotions and mark them &quot;Not spam&quot;.`;
  const html = shell("Complete your account setup", opts.orgName, body, { label: "Complete Account Setup &rarr;", href: opts.link }, footer, subject);
  return sendEmail({ to: opts.to, subject, html, text: `Hi ${opts.staffName},\n\nWelcome to ${opts.orgName}! Create your password and complete your profile here (single-use, expires): ${opts.link}\n\n${opts.expiresNote}` });
}

export async function sendPasswordReset(opts: { to: string; name: string; link: string }) {
  const subject = "Reset your ChronoSwift password";
  const body =
    `<p style="margin:0 0 12px;">Hi ${esc(opts.name)},</p>` +
    `<p style="margin:0;">We received a request to reset your password. Click below — the link expires in 60 minutes:</p>`;
  const footer = `&#128274; If you didn't request this, you can safely ignore this email.<br><br>&#128229; Can&apos;t find it? Check Spam/Promotions.`;
  const html = shell("Reset your password", "ChronoSwift", body, { label: "Reset password &rarr;", href: opts.link }, footer, subject);
  return sendEmail({ to: opts.to, subject, html, text: `Hi ${opts.name},\n\nReset your password here (expires in 60 minutes): ${opts.link}` });
}

export async function sendWelcome(opts: { to: string; name: string; orgName: string }) {
  const subject = `Welcome to ${opts.orgName} on ChronoSwift`;
  const body =
    `<p style="margin:0 0 12px;">Hi ${esc(opts.name)},</p>` +
    `<p style="margin:0;">Your account is active. You can now sign in and record attendance by scanning your organization's QR code at the entrance.</p>`;
  const appUrl = process.env.APP_URL || "";
  const html = shell("Welcome aboard", opts.orgName, body, { label: "Sign in to ChronoSwift &rarr;", href: `${appUrl}/login` }, undefined, subject);
  return sendEmail({ to: opts.to, subject, html, text: `Hi ${opts.name},\n\nYour account at ${opts.orgName} is active. Sign in: ${appUrl}/login` });
}
