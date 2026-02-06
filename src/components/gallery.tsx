'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import type { EmblaCarouselType, EmblaOptionsType } from 'embla-carousel-react';
import useEmblaCarousel from 'embla-carousel-react';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ArrowLeft, ArrowRight, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

const CarouselInstance = ({
  images,
  options,
}: {
  images: { id: string; imageUrl: string; description: string, imageHint: string }[];
  options?: EmblaOptionsType;
}) => {
  const [emblaRef, emblaApi] = useEmblaCarousel(options);
  const [isPaused, setIsPaused] = useState(false);

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
    setIsPaused(true);
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
    setIsPaused(true);
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi || isPaused) return;

    const autoplay = setInterval(() => {
      if (emblaApi.canScrollNext()) {
        emblaApi.scrollNext();
      } else {
        emblaApi.scrollTo(0);
      }
    }, 15000);

    return () => clearInterval(autoplay);
  }, [emblaApi, isPaused]);

  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {images.map((img) => (
            <div className="relative flex-[0_0_100%] sm:flex-[0_0_50%] md:flex-[0_0_33.33%] lg:flex-[0_0_25%] p-2" key={img.id}>
              <div className="aspect-video w-full overflow-hidden rounded-lg shadow-lg">
                <Image
                  src={img.imageUrl}
                  alt={img.description}
                  width={800}
                  height={600}
                  data-ai-hint={img.imageHint}
                  className="h-full w-full object-cover transition-transform duration-300 ease-in-out hover:scale-105"
                  style={{ filter: 'contrast(1.1) saturate(1.1) brightness(1.05)' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <Button
        variant="outline"
        size="icon"
        className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full z-10 hidden md:inline-flex"
        onClick={scrollPrev}
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="sr-only">Previous slide</span>
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full z-10 hidden md:inline-flex"
        onClick={scrollNext}
      >
        <ArrowRight className="h-4 w-4" />
        <span className="sr-only">Next slide</span>
      </Button>
    </div>
  );
};

export default function Gallery() {
  const [allImages, setAllImages] = useState(PlaceHolderImages);
  const inputFileRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    inputFileRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newImage = {
          id: `uploaded-${Date.now()}`,
          imageUrl: reader.result as string,
          description: file.name,
          imageHint: 'uploaded image'
        };
        setAllImages((prev) => [newImage, ...prev]);
      };
      reader.readAsDataURL(file);
    }
  };

  const midIndex = Math.ceil(allImages.length / 2);
  const firstRowImages = allImages.slice(0, midIndex);
  const secondRowImages = allImages.slice(midIndex);

  return (
    <section id="gallery" className="w-full py-12 md:py-24 lg:py-32 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="mb-8 w-full">
            <div className="relative flex items-center justify-center">
              <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-5xl">
                Check out our gallery
              </h2>
              <Button
                variant="outline"
                className="absolute right-0 top-1/2 -translate-y-1/2"
                onClick={handleUploadClick}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Photo
              </Button>
              <input
                type="file"
                ref={inputFileRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <CarouselInstance images={firstRowImages} options={{ loop: true }} />
          <CarouselInstance images={secondRowImages} options={{ loop: true, direction: 'rtl' }} />
        </div>
      </div>
    </section>
  );
}
