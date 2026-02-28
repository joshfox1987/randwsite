'use client';
import { useState, useRef, useEffect, memo } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, ChevronLeft, ChevronRight, ImagePlus, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useStorage, useCollection, useUser, useMemoFirebase } from '@/firebase';
import { collection, serverTimestamp, addDoc, updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { describeImage } from '@/app/actions';

/**
 * GalleryImage component handles individual image loading states and optimizations.
 * Uses memo to prevent unnecessary re-renders of non-active slides.
 */
const GalleryImage = memo(({ image, isActive, isPriority }: { image: any, isActive: boolean, isPriority: boolean }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const imageUrl = image.imageUrl || image.url;

  if (!imageUrl) return null;

  return (
    <div className={cn(
      "absolute inset-0 transition-opacity duration-1000 ease-in-out",
      isActive ? "opacity-100 z-10" : "opacity-0 z-0"
    )}>
      {!isLoaded && <Skeleton className="w-full h-full bg-neutral-900" />}
      
      <Image
        src={imageUrl}
        alt={image.description || 'R & W Project'}
        fill
        className={cn(
          "object-cover transition-all duration-700",
          isLoaded ? "scale-100 blur-0" : "scale-105 blur-lg"
        )}
        onLoad={() => setIsLoaded(true)}
        priority={isPriority}
        sizes="(max-width: 1280px) 100vw, 1280px"
        quality={75}
      />
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
      
      <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 transform transition-transform duration-700 delay-100">
         <p className={cn(
           "text-white text-xl md:text-3xl font-headline font-bold drop-shadow-lg transition-all duration-1000",
           isActive ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
         )}>
            {image.description || 'Completed Project'}
         </p>
      </div>
    </div>
  );
});

GalleryImage.displayName = 'GalleryImage';

export default function Gallery() {
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const inputFileRef = useRef<HTMLInputElement>(null);
  const { user } = useUser();

  const [isUploading, setIsUploading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Memoize the gallery query - fetch all, sort locally to avoid index errors
  const galleryQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'gallery_images') : null),
    [firestore]
  );
  
  const { data: rawImages, isLoading: areImagesLoading, error: firestoreError } = useCollection<any>(galleryQuery);

  // Filter and sort images locally to be robust against missing fields or missing indexes
  const firestoreImages = rawImages ? [...rawImages].sort((a, b) => {
    const timeA = a.uploadedAt?.toMillis?.() || new Date(a.uploadedAt).getTime() || 0;
    const timeB = b.uploadedAt?.toMillis?.() || new Date(b.uploadedAt).getTime() || 0;
    return timeB - timeA;
  }) : null;

  useEffect(() => {
    if (!firestoreImages || firestoreImages.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % firestoreImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [firestoreImages, isPaused]);

  const handleUploadClick = () => {
    inputFileRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !firestore || !storage) return;

    setIsUploading(true);
    toast({ title: 'Upload Started', description: `Processing ${files.length} image(s)...` });

    for (const file of Array.from(files)) {
      try {
        const timestamp = Date.now();
        const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const storageRef = ref(storage, `gallery_images/${fileName}`);
        
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);

        const docRef = await addDoc(collection(firestore, 'gallery_images'), {
          imageUrl: downloadURL,
          url: downloadURL,
          description: 'R & W Property Solutions Project',
          uploadedAt: serverTimestamp(),
          uploaderUid: user?.uid || 'anonymous',
        });

        describeImage(downloadURL).then(async (result) => {
          if (result.success && result.description) {
            await updateDoc(doc(firestore, 'gallery_images', docRef.id), {
              description: result.description
            });
          }
        });

      } catch (error: any) {
        console.error('Upload failed:', error);
        toast({ 
          variant: 'destructive', 
          title: 'Upload Failed', 
          description: error.message || 'Could not upload image.' 
        });
      }
    }

    if (inputFileRef.current) inputFileRef.current.value = '';
    setIsUploading(false);
    toast({ title: 'Upload Complete', description: 'Your photos are now live.' });
  };

  const nextSlide = () => {
    if (!firestoreImages) return;
    setCurrentIndex((prev) => (prev + 1) % firestoreImages.length);
  };

  const prevSlide = () => {
    if (!firestoreImages) return;
    setCurrentIndex((prev) => (prev === 0 ? firestoreImages.length - 1 : prev - 1));
  };

  return (
    <section id="gallery" className="w-full bg-background py-16 md:py-24 border-t">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-10">
          <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-5xl">
            Cinematic Gallery
          </h2>
          <p className="text-muted-foreground max-w-[600px]">
            Showcasing our expert property restoration and debris removal projects.
          </p>
          
          <div className="pt-4 flex gap-4">
            <Button
                variant="outline"
                onClick={handleUploadClick}
                disabled={isUploading}
                className="rounded-full px-8 h-12 transition-all hover:scale-105 shadow-md"
            >
                {isUploading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                    <Upload className="mr-2 h-5 w-5" />
                )}
                {isUploading ? 'Uploading...' : 'Add Project Photos'}
            </Button>
            <input type="file" ref={inputFileRef} onChange={handleFileChange} className="hidden" accept="image/*" multiple />
          </div>
        </div>

        {firestoreError && (
            <Alert variant="destructive" className="max-w-2xl mx-auto mb-8">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Connection Issue</AlertTitle>
                <AlertDescription>
                    Unable to reach the gallery database. Please refresh the page to reconnect.
                </AlertDescription>
            </Alert>
        )}

        <div className="relative group max-w-5xl mx-auto overflow-hidden rounded-2xl shadow-2xl aspect-video bg-neutral-900 border">
          {areImagesLoading ? (
            <Skeleton className="w-full h-full" />
          ) : !firestoreImages || firestoreImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-4 p-8 text-center">
              <ImagePlus className="h-16 w-16 opacity-20" />
              <div className="space-y-4">
                  <p className="text-lg font-semibold">Gallery is empty</p>
                  <p className="text-sm">Please run <code>bash add_images.sh</code> to sync your images.</p>
              </div>
            </div>
          ) : (
            <>
              {firestoreImages.map((image, index) => {
                const isActive = index === currentIndex;
                const isNext = index === (currentIndex + 1) % firestoreImages.length;
                const isPrev = index === (currentIndex - 1 + firestoreImages.length) % firestoreImages.length;
                
                if (!isActive && !isNext && !isPrev) return null;

                return (
                  <GalleryImage 
                    key={image.id}
                    image={image}
                    isActive={isActive}
                    isPriority={isActive || index < 2}
                  />
                );
              })}

              <button
                onClick={prevSlide}
                className="absolute left-6 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/50 hover:bg-primary text-white transition-all opacity-0 group-hover:opacity-100 backdrop-blur-md shadow-lg"
                aria-label="Previous"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-6 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/50 hover:bg-primary text-white transition-all opacity-0 group-hover:opacity-100 backdrop-blur-md shadow-lg"
                aria-label="Next"
              >
                <ChevronRight className="h-8 w-8" />
              </button>

              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                {firestoreImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={cn(
                      "h-1.5 transition-all duration-300 rounded-full",
                      index === currentIndex ? "w-12 bg-primary" : "w-2.5 bg-white/40 hover:bg-white/70"
                    )}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
