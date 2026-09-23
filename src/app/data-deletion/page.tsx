import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Data Deletion | R & W Property Solutions',
  description: 'Data deletion instructions for R & W Property Solutions website visitors and Facebook or Messenger users.',
};

export default function DataDeletionPage() {
  return (
    <main className="min-h-[100dvh] bg-background py-16 md:py-24">
      <div className="container max-w-4xl px-4 md:px-6">
        <Link href="/" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
          Back to home
        </Link>
        <div className="mt-6 space-y-8">
          <header className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">R &amp; W Property Solutions</p>
            <h1 className="font-headline text-4xl font-bold tracking-tight sm:text-5xl">Data Deletion Request</h1>
            <p className="text-muted-foreground md:text-lg">
              If you contacted R&amp;W Property Solutions through this website, Facebook, or Messenger and want your submitted contact data reviewed or deleted, use the steps below.
            </p>
          </header>

          <section className="space-y-3">
            <h2 className="font-headline text-2xl font-bold">How to request deletion</h2>
            <ol className="list-decimal space-y-2 pl-6 text-muted-foreground">
              <li>Email <a className="font-semibold text-primary underline-offset-4 hover:underline" href="mailto:RnWpropertyrepair@gmail.com">RnWpropertyrepair@gmail.com</a> with the subject line <span className="font-semibold text-foreground">Data Deletion Request</span>.</li>
              <li>Include your name, preferred contact method, and enough detail for us to identify your inquiry, such as the phone number, email address, or Facebook account used.</li>
              <li>If your request relates to Facebook or Messenger, include the approximate date of the conversation or screenshots if available.</li>
            </ol>
          </section>

          <section className="space-y-3">
            <h2 className="font-headline text-2xl font-bold">What happens next</h2>
            <p className="text-muted-foreground">
              We will review the request, confirm the records involved, and delete or anonymize eligible contact data that is no longer required for active business, legal, safety, or record-keeping purposes.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-headline text-2xl font-bold">Response window</h2>
            <p className="text-muted-foreground">
              R&amp;W Property Solutions will aim to acknowledge deletion requests within 7 business days and complete eligible deletion actions within 30 days.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-headline text-2xl font-bold">Need help?</h2>
            <p className="text-muted-foreground">
              If you need help submitting a request, call <a className="font-semibold text-primary underline-offset-4 hover:underline" href="tel:208-831-6824">(208) 831-6824</a> or email <a className="font-semibold text-primary underline-offset-4 hover:underline" href="mailto:RnWpropertyrepair@gmail.com">RnWpropertyrepair@gmail.com</a>.
            </p>
          </section>

          <p className="text-sm text-muted-foreground">Last updated: May 9, 2026</p>
        </div>
      </div>
    </main>
  );
}