'use client';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, ChevronLeft, ChevronRight, ImagePlus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useStorage, useCollection, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, serverTimestamp, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { cn } from '@/lib/utils';

export default function Gallery() {
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const inputFileRef = useRef<HTMLInputElement>(null);
  const { user, isUserLoading: isAuthLoading } = useUser();

  const [isUploading, setIsUploading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Removed orderBy('uploadedAt') to ensure images appear even if that field is missing
  const galleryQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'gallery_images') : null),
    [firestore]
  );
  
  const { data: rawImages, isLoading: areImagesLoading } = useCollection<any>(galleryQuery);

  // Sort in memory if needed, handling missing timestamps gracefully
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
    }, 5000);

    return () => clearInterval(interval);
  }, [firestoreImages, isPaused]);

  const handleUploadClick = () => {
    inputFileRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !firestore || !storage || !user) return;

    setIsUploading(true);

    for (const file of Array.from(files)) {
      try {
        const storageRef = ref(storage, `gallery_images/${user.uid}/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);

        await addDoc(collection(firestore, 'gallery_images'), {
          imageUrl: downloadURL,
          description: file.name,
          uploadedAt: serverTimestamp(),
          uploaderUid: user.uid,
          storagePath: storageRef.fullPath,
        });

        toast({ title: 'Upload Successful', description: `${file.name} has been added to the gallery.` });
      } catch (error) {
        console.error('Upload failed:', error);
        toast({ variant: 'destructive', title: 'Upload Failed', description: `Could not upload ${file.name}.` });
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

  const isAuthenticating = isAuthLoading;

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
          {user && (
            <div className="pt-4">
                <Button
                    variant="outline"
                    onClick={handleUploadClick}
                    disabled={isUploading || isAuthenticating}
                    className="rounded-full px-8"
                >
                    {isUploading || isAuthenticating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                    <Upload className="mr-2 h-4 w-4" />
                    )}
                    {isAuthenticating ? 'Authenticating...' : (isUploading ? 'Uploading...' : 'Add Project Photos')}
                </Button>
                <input type="file" ref={inputFileRef} onChange={handleFileChange} className="hidden" accept="image/*" multiple />
            </div>
          )}
        </div>

        <div className="relative group max-w-5xl mx-auto overflow-hidden rounded-2xl shadow-2xl aspect-video bg-black">
          {areImagesLoading ? (
            <Skeleton className="w-full h-full" />
          ) : !firestoreImages || firestoreImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-white/50 space-y-4">
              <ImagePlus className="h-16 w-16" />
              <p className="text-xl">Your cinematic gallery is empty.</p>
              <p className="text-sm">Try uploading a photo using the button above.</p>
            </div>
          ) : (
            <>
              {firestoreImages.map((image, index) => (
                <div
                  key={image.id}
                  className={cn(
                    "absolute inset-0 transition-opacity duration-1000 ease-in-out",
                    index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-0 left-0 right-0 p-8 transform transition-transform duration-500 translate-y-0 opacity-100">
                     <p className="text-white text-2xl font-headline font-bold drop-shadow-lg">
                        {image.description || 'Completed Project'}
                     </p>
                  </div>
                </div>
              ))}

              {/* Navigation Arrows */}
              <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-all opacity-0 group-hover:opacity-100"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-all opacity-0 group-hover:opacity-100"
                aria-label="Next image"
              >
                <ChevronRight className="h-8 w-8" />
              </button>

              {/* Progress Indicators */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                {firestoreImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={cn(
                      "h-1.5 transition-all rounded-full",
                      index === currentIndex ? "w-8 bg-primary" : "w-2 bg-white/30 hover:bg-white/50"
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
