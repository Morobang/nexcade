import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service — NexCade',
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="font-display text-5xl text-white mb-2">TERMS OF SERVICE</h1>
      <p className="text-zinc-500 text-sm mb-12">Last updated: June 2026</p>

      <div className="flex flex-col gap-10 text-zinc-300 text-sm leading-relaxed">

        <Section title="1. Acceptance of Terms">
          By creating a NexCade account or using our platform, you agree to these Terms of Service.
          If you do not agree, do not use NexCade. We may update these terms at any time — continued
          use of the platform after changes means you accept the new terms.
        </Section>

        <Section title="2. Accounts">
          You must be at least 13 years old to create an account. You are responsible for keeping
          your login credentials secure. One person may only hold one player account. NexCade
          reserves the right to suspend or terminate accounts that violate these terms.
        </Section>

        <Section title="3. Tournament Participation">
          By registering for a tournament you agree to compete fairly and respect other players
          and arcade staff. Match results are final once recorded by the arcade operator. NexCade
          is not responsible for disputes between players. Entry fees are non-refundable unless
          a tournament is cancelled by the arcade.
        </Section>

        <Section title="4. Arcade Owners">
          Arcade owners are responsible for accurately representing their venue and running
          tournaments fairly. NexCade reviews all arcade applications but does not guarantee
          the quality or safety of any venue. Arcade owners must comply with all applicable
          South African laws when operating events.
        </Section>

        <Section title="5. Prohibited Conduct">
          You may not use NexCade to harass or abuse other users, create fake accounts,
          manipulate tournament results, or use the platform for any unlawful purpose.
          Violations may result in immediate account suspension.
        </Section>

        <Section title="6. Intellectual Property">
          All NexCade content, branding, and software is owned by NexCade. You may not copy,
          reproduce, or redistribute any part of the platform without written permission.
        </Section>

        <Section title="7. Limitation of Liability">
          NexCade is provided as-is. We are not liable for any losses arising from your use of
          the platform, tournament outcomes, or interactions with other users or arcade venues.
        </Section>

        <Section title="8. Contact">
          For questions about these terms, contact us at{' '}
          <a href="mailto:support@nexcade.co.za" className="text-red-400 hover:text-red-300 underline">
            support@nexcade.co.za
          </a>.
        </Section>

      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-white font-bold text-base mb-3">{title}</h2>
      <p>{children}</p>
    </div>
  );
}
