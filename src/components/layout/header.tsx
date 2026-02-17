import { Logo } from '@/components/logo';
import { Phone, Facebook } from 'lucide-react';
import { Button } from '../ui/button';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-20 items-center">
        <div className="mr-auto flex items-center">
          <a href="/" className="flex items-center gap-2">
            <Logo className="h-12 w-12" />
            <span className="font-headline text-lg font-bold text-foreground">
              Property Solutions
            </span>
          </a>
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
              <Facebook className="h-5 w-5 text-foreground/60 transition-colors hover:text-foreground/80" />
            </a>
          </Button>
        </nav>
      </div>
    </header>
  );
}
