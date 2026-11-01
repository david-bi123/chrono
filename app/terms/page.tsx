import { LegalPage, List, Section } from "@/components/legal/legal-page";

export const metadata = {
  title: "Terms of Service",
  description:
    "The agreement between ChronoSwift and the organizations that use it — accounts, responsibilities, acceptable use, liability and governing law.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="November 1, 2026">
      <Section title="1. The agreement">
        <p>
          These Terms of Service (&quot;Terms&quot;) govern all use of ChronoSwift, a web service for
          recording and managing staff attendance. ChronoSwift is operated primarily from Ghana and is
          governed by Ghanaian law, while serving organizations and users in other countries on the
          same principles.
        </p>
        <p>
          Do not use ChronoSwift if you do not accept these Terms as written.
        </p>
      </Section>

      <Section title="2. Accounts and roles">
        <List items={[
          "The platform owner (super admin) operates the service and, through it, approves and monitors organizations using it.",
          "An organization administrator (the administrator) registers their organization, nominates its administrative contact, and is responsible for the staff accounts within that organization.",
          "Employees (staff) record attendance by scanning their organization's QR code and are responsible for clocking in and out truthfully.",
          "Accounts are strictly per person. Do not share passwords or reuse another person's account.",
        ]} />
      </Section>

      <Section title="3. What administrators agree to">
        <p>By creating an organization on ChronoSwift, the administrator confirms that they:</p>
        <List items={[
          "Have authority to bind their organization to these Terms and to register its data.",
          "Will keep staff and organization information accurate and only for real staff.",
          "Will make sure staff are informed, before or when they start scanning, that their attendance is recorded on ChronoSwift — and will use that data lawfully under their own country's employment and data-protection rules.",
          "Respond to their staff's questions and requests about attendance data, including those relayed to ChronoSwift's privacy contact.",
        ]} />
      </Section>

      <Section title="4. Fees">
        <p>
          Use of ChronoSwift is currently free for organizations. If paid plans are introduced in the
          future, we will tell you plainly what costs what before anyone is charged (and these Terms
          will be amended accordingly). No existing organization will be moved onto a paid plan
          without notice and the choice to stay or leave.
        </p>
      </Section>

      <Section title="5. Acceptable use">
        <p>You must not:</p>
        <List items={[
          "Clock in or out for anyone else, or scan a QR code belonging to another organization.",
          "Probe or attack the service, attempt to discover vulnerabilities, or reverse-engineer parts of it you were not given access to.",
          "Interfere with audit records or with the truthfulness of attendance data.",
          "Store content that is illegal or dishonest, or use the service to break the law, including data-protection and employment law.",
        ]} />
        <p className="mt-3">
          Breaking these rules may lead to suspension or deletion of your organization&apos;s access.
          Where required, suspected unlawful use may be reported.
        </p>
      </Section>

      <Section title="6. Availability and accuracy">
        <p>
          ChronoSwift works &quot;as is&quot;. We aim for high availability and we record the server-side
          truth of every clock-in, but we cannot promise the service will never be unavailable, and we
          are not responsible for factors outside our control — your internet connection or a phone
          whose camera or clock is having a bad day — that occasionally prevent someone from scanning
          on time. Organizations remain responsible for having manual fallback procedures for those
          moments and for reporting anything that looks wrong on their dashboards promptly.
        </p>
      </Section>

      <Section title="7. Intellectual property">
        <p>
          The ChronoSwift name, brand, software and design are owned by ChronoSwift. You own your own
          data: your organization&apos;s staff list, attendance records and settings belong to your
          organization. If you stop using ChronoSwift, you may ask for your data to be deleted — the
          mechanics and timing are described in the Privacy Policy.
        </p>
      </Section>

      <Section title="8. Limitation of liability">
        <p>
          To the maximum extent the law permits, ChronoSwift is not liable for indirect, special or
          consequential losses, including loss of profits, data or business opportunities, arising
          from use of the service. Nothing in these Terms limits any liability that cannot be
          lawfully limited, including liability for deliberately harmful behavior.
        </p>
      </Section>

      <Section title="9. Suspension and termination">
        <p>
          We may suspend or delete an organization&apos;s access for breaching these Terms, for
          service-integrity or security reasons, or when the law requires it. Administrators may stop
          using ChronoSwift and delete their records at any time. When an organization is deleted, we
          permanently remove its data, subject only to the short backup-retention periods described
          in the Privacy Policy.
        </p>
      </Section>

      <Section title="10. Governing law and disputes">
        <p>
          These Terms are governed by the laws of the Republic of Ghana, without prejudice to
          protections that cannot be excluded under the law where a user lives. Disputes will be
          resolved amicably where possible. Where they cannot be, the courts of Ghana will hear the
          dispute, unless the user&apos;s local law grants you a mandatory right to use your local courts.
        </p>
      </Section>

      <Section title="11. Changes to these Terms">
        <p>
          We may change these Terms as the service evolves. The date at the top always shows the
          version in force, and material changes will be communicated to administrators in advance of
          taking effect.
        </p>
      </Section>

      <Section title="12. Contact">
        <p>
          Questions about these Terms: <strong>samueldagbo50@gmail.com</strong>
        </p>
      </Section>
    </LegalPage>
  );
}
