import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — NexCade',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="font-display text-5xl text-white mb-2">PRIVACY POLICY</h1>
      <p className="text-zinc-500 text-sm mb-12">Last updated: June 2026</p>

      <div className="flex flex-col gap-10 text-zinc-300 text-sm leading-relaxed">

        <Section title="1. What We Collect">
          When you create an account we collect your full name, email address, gamer tag, and
          WhatsApp number. Arcade owners also provide venue details such as address and contact
          information. We also collect gameplay data such as tournament registrations, results,
          and season points.
        </Section>

        <Section title="2. How We Use Your Data">
          We use your information to operate the NexCade platform — managing tournaments,
          displaying leaderboards, and connecting players with arcades. Your WhatsApp number
          may be used to send event reminders. We do not sell your data to third parties.
        </Section>

        <Section title="3. Public Information">
          Your gamer tag, tournament results, and season points are publicly visible on
          NexCade. Your full name may appear on leaderboards and result pages. Your email
          and phone number are never shown publicly.
        </Section>

        <Section title="4. Data Storage">
          Your data is stored securely using Supabase, hosted on AWS infrastructure.
          We use row-level security to ensure users can only access data they are
          authorised to see.
        </Section>

        <Section title="5. Cookies and Sessions">
          NexCade uses authentication cookies to keep you logged in. We do not use
          advertising or tracking cookies.
        </Section>

        <Section title="6. Your Rights">
          You have the right to access, correct, or delete your personal data at any time.
          To request deletion of your account and data, contact us at{' '}
          <a href="mailto:support@nexcade.co.za" className="text-red-400 hover:text-red-300 underline">
            support@nexcade.co.za
          </a>.
        </Section>

        <Section title="7. Changes to This Policy">
          We may update this Privacy Policy from time to time. We will notify users of
          significant changes by posting a notice on the platform.
        </Section>

        <Section title="8. Contact">
          Questions about this policy? Reach us at{' '}
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
