'use client';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, ChevronLeft, ChevronRight, ImagePlus, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useStorage, useCollection, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, serverTimestamp, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

export default function Gallery() {
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const inputFileRef = useRef<HTMLInputElement>(null);
  const { user, isUserLoading: isAuthLoading, userError } = useUser();

  const [isUploading, setIsUploading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // We fetch images without a strict sort to avoid index requirements or failures if fields are missing
  const galleryQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'gallery_images') : null),
    [firestore]
  );
  
  const { data: rawImages, isLoading: areImagesLoading, error: firestoreError } = useCollection<any>(galleryQuery);

  // Sort in memory to handle missing 'uploadedAt' gracefully
  const firestoreImages = rawImages ? [...rawImages].sort((a, b) => {
    const timeA = a.uploadedAt?.toMillis?.() || a.uploadedAt || 0;
    const timeB = b.uploadedAt?.toMillis?.() || b.uploadedAt || 0;
    return timeB - timeA;
  }) : null;

  // Auto-play effect
  useEffect(() => {
    if (!firestoreImages || firestoreImages.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % firestoreImages.length);
    }, 6000); // 6 seconds per slide for a cinematic feel

    return () => clearInterval(interval);
  }, [firestoreImages, isPaused]);

  const handleUploadClick = () => {
    if (!user) {
        toast({
            variant: 'destructive',
            title: 'Not Authenticated',
            description: 'Please wait a moment while we sign you in anonymously.',
        });
        return;
    }
    inputFileRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !firestore || !storage || !user) return;

    setIsUploading(true);

    for (const file of Array.from(files)) {
      try {
        const timestamp = Date.now();
        const storageRef = ref(storage, `gallery_images/${user.uid}/${timestamp}_${file.name}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);

        await addDoc(collection(firestore, 'gallery_images'), {
          imageUrl: downloadURL,
          url: downloadURL, // Support both field names for compatibility
          description: file.name,
          uploadedAt: serverTimestamp(),
          uploaderUid: user.uid,
          storagePath: storageRef.fullPath,
        });

        toast({ title: 'Success', description: `${file.name} added to gallery.` });
      } catch (error) {
        console.error('Upload failed:', error);
        toast({ variant: 'destructive', title: 'Upload Failed', description: `Could not upload ${file.name}. Check your internet and permissions.` });
      }
    }

    if (inputFileRef.current) {
        inputFileRef.current.value = '';
    }
    setIsUploading(false);
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
    <section id="gallery" className="w-full bg-background py-24 md:py-32">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-5xl">
            Cinematic Gallery
          </h2>
          <p className="text-muted-foreground max-w-[600px]">
            Explore our latest property restoration and repair projects.
          </p>
          
          <div className="pt-4 flex flex-col items-center gap-2">
            <Button
                variant="outline"
                onClick={handleUploadClick}
                disabled={isUploading || isAuthLoading}
                className="rounded-full px-8 h-12 text-base shadow-sm hover:shadow-md transition-all"
            >
                {isUploading || isAuthLoading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                    <Upload className="mr-2 h-5 w-5" />
                )}
                {isAuthLoading ? 'Connecting...' : (isUploading ? 'Uploading...' : 'Add Project Photos')}
            </Button>
            <input type="file" ref={inputFileRef} onChange={handleFileChange} className="hidden" accept="image/*" multiple />
            
            {userError && (
                <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Auth Error: {userError.message}
                </p>
            )}
          </div>
        </div>

        {firestoreError && (
            <Alert variant="destructive" className="max-w-2xl mx-auto mb-8">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Database Error</AlertTitle>
                <AlertDescription>
                    We couldn't load the gallery images. This might be due to a permission issue or a missing index.
                </AlertDescription>
            </Alert>
        )}

        <div className="relative group max-w-5xl mx-auto overflow-hidden rounded-2xl shadow-2xl aspect-video bg-neutral-900 border border-white/5">
          {areImagesLoading ? (
            <Skeleton className="w-full h-full" />
          ) : !firestoreImages || firestoreImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-white/40 space-y-4 p-8 text-center">
              <ImagePlus className="h-20 w-20 opacity-20" />
              <div className="space-y-2">
                  <p className="text-xl font-semibold">Your cinematic gallery is empty.</p>
                  <p className="text-sm max-w-md mx-auto">
                    If you've already uploaded images to Storage, make sure they are also registered in the 'gallery_images' Firestore collection. You can also use the button above to add them directly.
                  </p>
              </div>
            </div>
          ) : (
            <>
              {firestoreImages.map((image, index) => (
                <div
                  key={image.id}
                  className={cn(
                    "absolute inset-0 transition-all duration-1000 ease-in-out",
                    index === currentIndex ? "opacity-100 scale-100 z-10" : "opacity-0 scale-105 z-0"
                  )}
                  onMouseEnter={() => setIsPaused(true)}
                  onMouseLeave={() => setIsPaused(false)}
                >
                  <Image
                    src={image.imageUrl || image.url}
                    alt={image.description || 'Project Image'}
                    fill
                    className="object-cover"
                    priority={index === currentIndex}
                    sizes="(max-width: 1280px) 100vw, 1280px"
                  />
                  {/* Cinematic Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />
                  
                  <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 transform transition-all duration-700 translate-y-0 opacity-100">
                     <p className="text-white text-2xl md:text-4xl font-headline font-bold drop-shadow-2xl">
                        {image.description?.replace(/\.[^/.]+$/, "") || 'Completed Project'}
                     </p>
                  </div>
                </div>
              ))}

              {/* Navigation Arrows */}
              <button
                onClick={prevSlide}
                className="absolute left-6 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/30 hover:bg-primary/80 text-white transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-6 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/30 hover:bg-primary/80 text-white transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm"
                aria-label="Next image"
              >
                <ChevronRight className="h-8 w-8" />
              </button>

              {/* Progress Indicators */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                {firestoreImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={cn(
                      "h-1.5 transition-all duration-300 rounded-full",
                      index === currentIndex ? "w-10 bg-primary" : "w-2 bg-white/40 hover:bg-white/60"
                    )}
                    aria-label={`Go to image ${index + 1}`}
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
