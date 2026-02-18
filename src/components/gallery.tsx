'use client';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Image from 'next/image';
import type { EmblaOptionsType } from 'embla-carousel-react';
import useEmblaCarousel from 'embla-carousel-react';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages, type ImagePlaceholder } from '@/lib/placeholder-images';
import { ArrowLeft, ArrowRight, Upload, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { enhanceUploadedImage } from '@/app/actions';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

// Firebase Imports
import { useFirestore, useStorage, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Helper to convert Data URL to Blob
const dataURLtoBlob = (dataurl: string) => {
    const arr = dataurl.split(',');
    if (arr.length < 2) return null;
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || mimeMatch.length < 2) return null;
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}

type UploadStatus = 'enhancing' | 'uploading' | 'error';
type DisplayImage = ImagePlaceholder & { status?: UploadStatus };

const MIN_GALLERY_IMAGES = 12;

const CarouselInstance = ({
  images,
  options,
}: {
  images: DisplayImage[];
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
      emblaApi.scrollNext();
    }, 15000);
    return () => clearInterval(autoplay);
  }, [emblaApi, isPaused]);

  if (!images.length) {
    return null;
  }

  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {images.map((img) => (
            <div className="relative flex-[0_0_100%] sm:flex-[0_0_50%] md:flex-[0_0_33.33%] lg:flex-[0_0_25%] p-2" key={img.id}>
              <div className="aspect-video w-full overflow-hidden rounded-lg shadow-lg">
                {img.status ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-muted text-center p-4">
                    {img.status === 'error' ? (
                       <>
                        <AlertTriangle className="h-8 w-8 text-destructive" />
                        <p className="mt-2 text-sm font-semibold text-destructive">Upload Failed</p>
                        <p className="text-xs text-muted-foreground">{img.description}</p>
                       </>
                    ) : (
                      <>
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="mt-2 text-sm text-muted-foreground">{img.status === 'enhancing' ? 'Enhancing...' : 'Uploading...'}</p>
                      </>
                    )}
                  </div>
                ) : (
                  <Image
                    src={img.imageUrl}
                    alt={img.description}
                    width={800}
                    height={600}
                    data-ai-hint={img.imageHint}
                    className="h-full w-full object-cover transition-transform duration-300 ease-in-out hover:scale-105"
                    style={{ filter: 'contrast(1.1) saturate(1.1) brightness(1.05)' }}
                  />
                )}
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
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const inputFileRef = useRef<HTMLInputElement>(null);

  const [localUploads, setLocalUploads] = useState<DisplayImage[]>([]);
  const isUploading = localUploads.some(u => u.status === 'enhancing' || u.status === 'uploading');

  const galleryQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, 'gallery_images'), orderBy('uploadedAt', 'desc')) : null,
    [firestore]
  );
  const { data: firestoreImages, isLoading: areImagesLoading } = useCollection<ImagePlaceholder>(galleryQuery);

  const allImages = useMemo(() => {
    const onlineImages = firestoreImages || [];
    let combined = [...localUploads, ...onlineImages];
    
    // Create a Set of IDs for quick lookup to avoid duplicates
    const presentIds = new Set(combined.map(img => img.id));
    
    // Filter placeholders to only include those not already present
    const remainingPlaceholders = PlaceHolderImages.filter(p => !presentIds.has(p.id));

    // If we have fewer images than the minimum, fill with placeholders
    if (combined.length < MIN_GALLERY_IMAGES) {
        combined = combined.concat(remainingPlaceholders.slice(0, MIN_GALLERY_IMAGES - combined.length));
    }
    
    return combined;
  }, [localUploads, firestoreImages]);
  
  const handleUploadClick = () => {
    inputFileRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const tempId = `uploading-${Date.now()}`;
    const reader = new FileReader();

    reader.onloadstart = () => {
      const newUpload: DisplayImage = {
        id: tempId,
        imageUrl: URL.createObjectURL(file), // Show a temporary local preview
        description: file.name,
        imageHint: 'enhancing',
        status: 'enhancing',
      };
      setLocalUploads(prev => [newUpload, ...prev]);
    };

    reader.onloadend = async () => {
      const originalDataUrl = reader.result as string;
      
      try {
        const enhancedDataUrl = await enhanceUploadedImage(originalDataUrl);
        setLocalUploads(prev => prev.map(u => u.id === tempId ? { ...u, status: 'uploading' } : u));
        
        const blob = dataURLtoBlob(enhancedDataUrl);
        if (!blob) throw new Error("Failed to convert enhanced image to Blob.");

        const storageRef = ref(storage, `gallery_images/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, blob);
        
        const downloadURL = await getDownloadURL(storageRef);

        const imageMetadata = {
          imageUrl: downloadURL,
          description: file.name,
          imageHint: 'uploaded image',
          uploadedAt: serverTimestamp(),
        };
        // This will be caught by useCollection and update the UI automatically
        addDocumentNonBlocking(collection(firestore, 'gallery_images'), imageMetadata);

        setLocalUploads(prev => prev.filter(u => u.id !== tempId));
        toast({
          title: "Upload Successful",
          description: "Your image has been added to the gallery.",
          action: <CheckCircle className="text-green-500" />,
        });

      } catch (error) {
        console.error('Full upload process failed:', error);
        setLocalUploads(prev => prev.map(u => u.id === tempId ? { ...u, status: 'error', description: (error as Error).message } : u));
        toast({ variant: 'destructive', title: "Upload Failed", description: "Could not save the image. Please try again." });
        
        setTimeout(() => {
             setLocalUploads(prev => prev.filter(u => u.id !== tempId));
        }, 5000);
      } finally {
        if (inputFileRef.current) inputFileRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  if (areImagesLoading && !firestoreImages) {
    return (
        <section id="gallery" className="w-full pt-24 pb-12 md:py-24 lg:py-32 bg-background">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="mb-8 w-full">
                 <div className="relative flex items-center justify-center">
                    <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-5xl">
                        Check out our gallery
                    </h2>
                 </div>
              </div>
            </div>
            <div className="flex flex-col gap-4">
                <div className="flex">
                    {[...Array(4)].map((_, i) => (
                        <div className="relative flex-[0_0_100%] sm:flex-[0_0_50%] md:flex-[0_0_33.33%] lg:flex-[0_0_25%] p-2" key={i}>
                            <Skeleton className="aspect-video w-full rounded-lg" />
                        </div>
                    ))}
                </div>
            </div>
          </div>
        </section>
    );
  }

  return (
    <section id="gallery" className="w-full pt-24 pb-12 md:py-24 lg:py-32 bg-background">
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
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                {isUploading ? 'Processing...' : 'Upload Photo'}
              </Button>
              <input
                type="file"
                ref={inputFileRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
                disabled={isUploading}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <CarouselInstance images={allImages} options={{ loop: true }} />
        </div>
      </div>
    </section>
  );
}
