import { Badge } from '@/components/ui/badge';

const services = [
    'Home Restoration',
    'Stump Removal',
    'Tree Trimming',
    'Home Renovations',
    'Upgrades',
    'Fire Restoration',
    'Water Damage Repair',
    "Saving your cat from the neighbor's tree",
    'Fence Line Installation and Repair',
    'And so much more...',
];

export default function Hero() {
  return (
    <section className="w-full py-20 md:py-32 lg:py-40 bg-secondary/50">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center space-y-8 text-center">
          <div className="space-y-2">
            <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none">
              WE ARE THE SOLUTION
            </h1>
            <p className="mx-auto max-w-[700px] text-foreground/80 md:text-xl">
              Your trusted partners for complete property restoration and efficient debris removal.
            </p>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-4 max-w-3xl">
            {services.map((service) => (
              <Badge key={service} variant="secondary" className="text-sm font-medium px-4 py-2 rounded-full">
                {service}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
