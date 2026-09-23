import Link from 'next/link';
import { Logo } from '@/components/logo';
import { Phone } from 'lucide-react';
import { Button } from '../ui/button';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-20 items-center">
        <div className="mr-auto flex items-center">
          <Link href="/" className="flex items-center gap-3">
            <Logo className="h-12 w-12" />
            <div className="flex flex-col leading-tight">
              <span className="font-headline text-lg font-bold text-foreground">
                R &amp; W Property Solutions
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Licensed General Contractor
              </span>
            </div>
          </Link>
        </div>
        <nav className="flex items-center space-x-2 md:space-x-4">
          <a
            href="#gallery"
            className="hidden font-medium text-foreground/60 transition-colors hover:text-foreground/80 sm:block"
          >
            Gallery
          </a>
          <a
            href="#reviews"
            className="hidden font-medium text-foreground/60 transition-colors hover:text-foreground/80 sm:block"
          >
            Reviews
          </a>
          <a
            href="#contact"
            className="hidden font-medium text-foreground/60 transition-colors hover:text-foreground/80 sm:block"
          >
            Contact
          </a>
           <Button asChild variant="ghost" className="hidden sm:inline-flex">
             <a href="tel:208-831-6824" className="flex items-center gap-2 font-semibold">
                <Phone className="h-4 w-4" />
                (208) 831-6824
            </a>
          </Button>
          <Button asChild variant="ghost" size="icon">
            <a href="https://www.facebook.com/RandWps" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="#1877F2"
                className="h-6 w-6 transition-opacity hover:opacity-80"
              >
                <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.494v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.142v3.24h-1.918c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.294h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" />
              </svg>
            </a>
          </Button>
        </nav>
      </div>
    </header>
  );
}
