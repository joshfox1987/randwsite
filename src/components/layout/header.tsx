import { Logo } from '@/components/logo';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex items-center">
          <a href="/" className="flex items-center gap-2">
            <Logo className="h-8 w-8" />
            <span className="font-headline text-lg font-bold text-foreground">
              R & W Property Solutions
            </span>
          </a>
        </div>
        <nav className="flex flex-1 items-center justify-end space-x-6">
          <a
            href="#contact"
            className="hidden font-medium text-foreground/60 transition-colors hover:text-foreground/80 md:block"
          >
            Contact Us
          </a>
        </nav>
      </div>
    </header>
  );
}
