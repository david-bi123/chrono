export function SpamNotice({ email, compact }: { email?: string; compact?: boolean }) {
  return (
    <div
      className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[13px] leading-relaxed text-amber-900"
      role="status"
    >
      <span className="font-semibold">📧 Email sent{email ? ` to ${email}` : ""}.</span>{" "}
      Can&apos;t find it? Check your <strong>Spam</strong> and <strong>Promotions</strong> folders
      {!compact && (
        <>
          {" "}— new senders often land there. If found, click{" "}
          <strong>Report not spam</strong> and add the sender to your contacts so future
          invites arrive in your inbox.
        </>
      )}
    </div>
  );
}
