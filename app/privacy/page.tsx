import { LegalPage, List, Section } from "@/components/legal/legal-page";

export const metadata = {
  title: "Privacy Policy",
  description:
    "How ChronoSwift collects, uses, stores and protects personal data — for organization administrators, employees and visitors.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="November 1, 2026">
      <Section title="1. Who we are">
        <p>
          ChronoSwift (&quot;ChronoSwift&quot;, &quot;we&quot;, &quot;us&quot;) is a web-based staff
          attendance service. An organization&apos;s administrator registers the organization, invites
          employees, and issues QR codes that employees scan to record when their workday starts and ends.
          ChronoSwift is designed and operated in Ghana, in line with Ghana&apos;s Data Protection Act,
          2012 (Act 843). We also serve organizations and users in other countries on the same principles.
        </p>
        <p>
          Contact for any privacy question or request: <strong>samueldagbo50@gmail.com</strong>
        </p>
      </Section>

      <Section title="2. Data we collect">
        <List items={[
          "Account details: full name, work email address, optional phone number, and your password stored only as a cryptographic hash (we can never see it).",
          "Organization details supplied by your employer: organization name, contact email, optional address, industry and attendance rules working start/end times, grace periods, working days and timezone.",
          "Attendance records: clock-in and clock-out date and time, the attendance status that results (present, late, early leave, half day), and which organization QR location was used.",
          "Security and audit records: actions performed on the service, timestamped, along with the IP address and browser type used, so every change to attendance data has a verifiable trail.",
          "Session information: a single authentication cookie, strictly necessary for staying signed in. We do not use advertising cookies or third-party analytics cookies.",
        ]} />
        <p className="mt-3">
          ChronoSwift does not track your location. Time is recorded from our servers, not from your
          personal device, and the service works entirely in your web browser with no app installing on
          your personal phone.
        </p>
      </Section>

      <Section title="3. Why we use the data">
        <List items={[
          "To run the attendance service your employer chose: creating your account, verifying your sign-in, storing your clock-in and clock-out records and making them visible to your organization's administrators.",
          "To deliver service emails such as your account invitation, password reset and welcome messages.",
          "To keep the service secure: audit logs, rate limiting, and detecting abuse.",
          "To comply with legal obligations that apply to us or to the organization using the service.",
        ]} />
        <p className="mt-3">
          Attendance records are maintained on behalf of your employer. ChronoSwift is the technical
          custodian of that data; your employer determines how it is used. You should have the right to
          ask your employer how your attendance data is used in workplace decisions, and we encourage
          administrators to inform and consult their staff about attendance monitoring — our Terms of
          Service make this an obligation that administrators must meet.
        </p>
      </Section>

      <Section title="4. Who we share data with">
        <p>We do not sell your data. We share it only with:</p>
        <List items={[
          "Your organization's administrators, who see the attendance and profile data of staff in their own organization. Organizations cannot see each other's data.",
          "Technical service providers acting for us and only on our documented instructions: MongoDB (database hosting), Vercel (application hosting), and Mailjet (delivery of transactional emails such as invitations and password resets). These providers do not use your data for their own purposes.",
          "Anyone else only with your consent, or where the law requires disclosure.",
        ]} />
      </Section>

      <Section title="5. How we protect the data">
        <List items={[
          "Passwords are stored as bcrypt hashes; plaintext passwords are never logged or emailed.",
          "Sign-in sessions use HTTP-only cookies and expire; invitations and reset links are single-use, hashed before storage and expire automatically.",
          "Data is transmitted to you encrypted in transit (HTTPS) and stored with the database provider's encryption at rest.",
          "Tenant isolation at every level: one organization cannot read or write another organization's data.",
          "Every sensitive action (logins, invitations, edits, deletions) is written to an audit log, so misuse can be detected and traced.",
        ]} />
      </Section>

      <Section title="6. How long we keep data">
        <p>
          Attendance records and account data are kept while your organization continues using
          ChronoSwift. When an organization or an employee record is deleted by an administrator, the
          personal data is removed from the live service fairly promptly; encrypted operational
          backups may keep residual copies for a short, fixed period before they age out
          automatically, and they exist only for recovery purposes. You can also ask us to delete
          your data sooner by contacting us.
        </p>
      </Section>

      <Section title="7. Your rights">
        <p>Depending on the law that applies to you — including Ghana&apos;s Act 843 or, where relevant, laws such as the EU GDPR — you have rights over your personal data:</p>
        <List items={[
          "To see what data about you is held and correct anything wrong.",
          "To ask for your data to be deleted when there is no legal need to keep it.",
          "To object or restrict certain processing, and to withdraw consent where the service relies on it.",
          "To ask how long data is kept and who it is shared with.",
        ]} />
        <p className="mt-3">
          Employees: raise requests with your organization&apos;s administrator first, or write to us
          directly at samueldagbo50@gmail.com and we will help you. Under Ghanaian law you may also
          complain to Ghana&apos;s Data Protection Commission if you believe your data has been mishandled.
        </p>
      </Section>

      <Section title="8. Children and personal devices">
        <p>
          ChronoSwift is for working adults and is not directed at children. The service runs in your
          browser; we do not ask you to install software and we do not collect data about your contacts,
          files, photos or other phone content.
        </p>
      </Section>

      <Section title="9. Changes to this policy">
        <p>
          We may update this policy as the service changes. The date at the top always shows the
          version in force. Significant changes will be communicated to administrators so they can
          inform their staff.
        </p>
      </Section>

      <Section title="10. Contact">
        <p>
          Questions, data requests or complaints: <strong>samueldagbo50@gmail.com</strong>
        </p>
      </Section>
    </LegalPage>
  );
}
