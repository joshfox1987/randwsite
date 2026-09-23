import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | R & W Property Solutions',
  description: 'Privacy policy for R & W Property Solutions website visitors, Facebook users, and lead inquiries.',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-[100dvh] bg-background py-16 md:py-24">
      <div className="container max-w-4xl px-4 md:px-6">
        <Link href="/" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
          Back to home
        </Link>
        <div className="mt-6 space-y-8">
          <header className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">R &amp; W Property Solutions</p>
            <h1 className="font-headline text-4xl font-bold tracking-tight sm:text-5xl">Privacy Policy</h1>
            <p className="text-muted-foreground md:text-lg">
              This policy explains what information R&amp;W Property Solutions may collect through this website, Facebook, Messenger, phone, email, and lead forms, and how that information is used to respond to service requests.
            </p>
          </header>

          <section className="space-y-3">
            <h2 className="font-headline text-2xl font-bold">Information we may collect</h2>
            <p className="text-muted-foreground">
              We may collect your name, phone number, email address, property location, photos you provide, service details, message history, and any scheduling or project notes you send to us.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-headline text-2xl font-bold">How we use information</h2>
            <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
              <li>Respond to questions and service inquiries.</li>
              <li>Evaluate projects and prepare job-specific bids.</li>
              <li>Schedule calls, site visits, and follow-up messages.</li>
              <li>Maintain internal records of leads, approvals, and completed work.</li>
              <li>Improve customer support, website content, and business operations.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-headline text-2xl font-bold">Facebook and Messenger</h2>
            <p className="text-muted-foreground">
              If you contact R&amp;W Property Solutions through Facebook or Messenger, your messages and related profile information may be used to respond to your request, qualify the project, and coordinate next steps with the business owner. We do not sell this information.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-headline text-2xl font-bold">Sharing of information</h2>
            <p className="text-muted-foreground">
              Information is used internally for business operations and customer service. It may be shared with service providers that support the website, analytics, hosting, messaging, or scheduling only as needed to operate the business.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-headline text-2xl font-bold">Retention</h2>
            <p className="text-muted-foreground">
              We keep inquiry and project records for as long as needed to respond to requests, support active projects, document business activity, and comply with legal or operational requirements.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-headline text-2xl font-bold">Contact and requests</h2>
            <p className="text-muted-foreground">
              To ask questions about this policy or request review or deletion of your submitted contact data, email <a className="font-semibold text-primary underline-offset-4 hover:underline" href="mailto:RnWpropertyrepair@gmail.com">RnWpropertyrepair@gmail.com</a> or call <a className="font-semibold text-primary underline-offset-4 hover:underline" href="tel:208-831-6824">(208) 831-6824</a>.
            </p>
          </section>

          <p className="text-sm text-muted-foreground">Last updated: May 9, 2026</p>
        </div>
      </div>
    </main>
  );
}