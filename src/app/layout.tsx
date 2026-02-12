import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { cn } from '@/lib/utils';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { AnonymousAuth } from '@/components/AnonymousAuth';
import { VisitorTracker } from '@/components/VisitorTracker';

export const metadata: Metadata = {
  title: 'R & W Property Solutions Hub',
  description: 'Your trusted partners for complete property restoration and efficient debris removal.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&family=Space+Grotesk:wght@300..700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={cn('font-body antialiased')}>
        <FirebaseClientProvider>
          <AnonymousAuth>
            <VisitorTracker />
            {children}
          </AnonymousAuth>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
