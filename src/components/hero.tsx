import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Phone, Mail } from 'lucide-react';
import { HeroImage } from '@/lib/placeholder-images';

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
    'Carpet Cleaning & Installation',
    'Drywall Repair',
    'Painting',
    'Pressure Washing',
    'Demolition Services',
    'Mold Remediation',
    'And so much more...',
];

export default function Hero() {
  return (
    <section className="relative w-full h-[80vh] min-h-[600px] flex items-center justify-center text-center text-primary-foreground">
      <Image
        src={HeroImage.imageUrl}
        alt={HeroImage.description}
        fill
        className="object-cover -z-20"
        style={{ filter: 'contrast(1.1) saturate(1.1) brightness(0.7)' }}
        data-ai-hint={HeroImage.imageHint}
        priority
      />
      <div className="absolute inset-0 bg-black/50 -z-10" />

      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center space-y-6">
          <div className="space-y-4">
            <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none">
              WE ARE THE SOLUTION
            </h1>
            <p className="mx-auto max-w-[700px] text-primary-foreground/80 md:text-xl">
              Your trusted partners for complete property restoration and efficient debris removal.
            </p>
          </div>

          <div className="pt-4 pb-8">
            <Popover>
              <PopoverTrigger asChild>
                  <Button size="lg" className="h-14 text-lg px-12">Get a Free Estimate</Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-1">
                  <div className="flex flex-col gap-1">
                       <Button asChild variant="ghost" className="justify-start gap-2">
                          <a href="tel:208-831-6824">
                             <Phone />
                             Call Now
                          </a>
                      </Button>
                       <Button asChild variant="ghost" className="justify-start gap-2">
                          <a href="mailto:RnWpropertyrepair@gmail.com">
                              <Mail />
                              Email Us
                          </a>
                      </Button>
                  </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-4 max-w-3xl pb-8 sm:pb-0">
            {services.map((service) => (
              <Badge key={service} variant="secondary" className="text-sm font-medium px-3 py-1 rounded-full bg-white/10 border-white/20 text-white hover:bg-white/20">
                {service}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
