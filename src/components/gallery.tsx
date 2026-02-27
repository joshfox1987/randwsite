'use client';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, ChevronLeft, ChevronRight, ImagePlus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useStorage, useCollection, useUser, useMemoFirebase } from '@/firebase';
import { collection, serverTimestamp, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

export default function Gallery() {
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const inputFileRef = useRef<HTMLInputElement>(null);
  const { user, isUserLoading: isAuthLoading } = useUser();

  const [isUploading, setIsUploading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Memoize the gallery query to avoid re-renders and errors
  const galleryQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'gallery_images') : null),
    [firestore]
  );
  
  const { data: rawImages, isLoading: areImagesLoading, error: firestoreError } = useCollection<any>(galleryQuery);

  // Filter and sort images locally to avoid needing manual Firestore Indexes
  const firestoreImages = rawImages ? [...rawImages].sort((a, b) => {
    const timeA = a.uploadedAt?.toMillis?.() || a.uploadedAt || 0;
    const timeB = b.uploadedAt?.toMillis?.() || b.uploadedAt || 0;
    return timeB - timeA;
  }) : null;

  // Auto-playing cinematic slideshow logic
  useEffect(() => {
    if (!firestoreImages || firestoreImages.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % firestoreImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [firestoreImages, isPaused]);

  const handleUploadClick = () => {
    if (isAuthLoading || !user) {
        toast({ title: "Authenticating", description: "Please wait a moment while we secure your connection..." });
        return;
    }
    inputFileRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !firestore || !storage) return;

    setIsUploading(true);

    for (const file of Array.from(files)) {
      try {
        const timestamp = Date.now();
        const storageRef = ref(storage, `gallery_images/${timestamp}_${file.name}`);
        
        // Upload to Storage
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);

        // Add metadata to Firestore
        await addDoc(collection(firestore, 'gallery_images'), {
          imageUrl: downloadURL,
          url: downloadURL,
          description: file.name.replace(/\.[^/.]+$/, ""),
          uploadedAt: serverTimestamp(),
          uploaderUid: user?.uid || 'anonymous',
        });

        toast({ title: 'Success', description: `${file.name} added to gallery.` });
      } catch (error: any) {
        console.error('Upload failed:', error);
        toast({ 
          variant: 'destructive', 
          title: 'Upload Failed', 
          description: error.message || `Could not upload ${file.name}.` 
        });
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
            Explore our latest property restoration and repair projects in high definition.
          </p>
          
          <div className="pt-4 flex gap-4">
            <Button
                variant="outline"
                onClick={handleUploadClick}
                disabled={isUploading || isAuthLoading}
                className="rounded-full px-8 h-12 text-base transition-all hover:scale-105"
            >
                {isUploading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                    <Upload className="mr-2 h-5 w-5" />
                )}
                {isUploading ? 'Uploading...' : isAuthLoading ? 'Authenticating...' : 'Add Project Photos'}
            </Button>
            <input type="file" ref={inputFileRef} onChange={handleFileChange} className="hidden" accept="image/*" multiple />
          </div>
        </div>

        {firestoreError && (
            <Alert variant="destructive" className="max-w-2xl mx-auto mb-8">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Database Sync Issue</AlertTitle>
                <AlertDescription>
                    We're having trouble loading the photos. Try running <code className="bg-white/10 px-1 rounded">bash add_images.sh</code> in your terminal to re-sync.
                </AlertDescription>
            </Alert>
        )}

        <div className="relative group max-w-5xl mx-auto overflow-hidden rounded-2xl shadow-2xl aspect-video bg-neutral-900 border border-white/5">
          {areImagesLoading ? (
            <Skeleton className="w-full h-full" />
          ) : !firestoreImages || firestoreImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-white/40 space-y-4 p-8 text-center">
              <ImagePlus className="h-20 w-20 opacity-20" />
              <div className="space-y-4">
                  <p className="text-xl font-semibold text-white">Your Gallery is Ready</p>
                  <div className="space-y-2 text-sm max-w-md mx-auto">
                    <p>To see your photos here, use the button above or run the sync script:</p>
                    <div className="bg-black/50 p-3 rounded font-mono text-white flex items-center justify-center gap-2">
                        <code>bash add_images.sh</code>
                    </div>
                  </div>
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
                    alt={image.description || 'Property Solution Project'}
                    fill
                    className="object-cover"
                    priority={index === currentIndex}
                    sizes="(max-width: 1280px) 100vw, 1280px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30 pointer-events-none" />
                  <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                     <p className="text-white text-2xl md:text-4xl font-headline font-bold drop-shadow-lg">
                        {image.description || 'Completed Project'}
                     </p>
                  </div>
                </div>
              ))}

              <button
                onClick={prevSlide}
                className="absolute left-6 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/40 hover:bg-primary text-white transition-all opacity-0 group-hover:opacity-100 backdrop-blur-md"
                aria-label="Previous"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-6 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/40 hover:bg-primary text-white transition-all opacity-0 group-hover:opacity-100 backdrop-blur-md"
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
                      index === currentIndex ? "w-10 bg-primary" : "w-2 bg-white/30 hover:bg-white/50"
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