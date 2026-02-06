export default function Hero() {
  return (
    <section className="w-full py-20 md:py-32 lg:py-40 bg-secondary/50">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="space-y-2">
            <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none">
              WE ARE THE SOLUTION
            </h1>
            <p className="mx-auto max-w-[700px] text-foreground/80 md:text-xl">
              Your trusted partners for complete property restoration and efficient debris removal.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
