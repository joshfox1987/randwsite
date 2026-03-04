'use client';
import { useState, useRef, useEffect, memo, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, ChevronLeft, ChevronRight, ImagePlus, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useStorage, useCollection, useUser, useMemoFirebase } from '@/firebase';
import { collection, serverTimestamp, updateDoc, doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { describeImage } from '@/app/actions';

// Image compression utility
const compressImage = (file: File, maxWidth = 1600, quality = 0.85): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Compression failed'));
          },
          'image/jpeg',
          quality
        );
      };
    };
    reader.onerror = (error) => reject(error);
  });
};

const GalleryImage = memo(({ image, isActive, isPriority }: { image: any, isActive: boolean, isPriority: boolean }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const imageUrl = image.imageUrl || image.url;

  if (!imageUrl) return null;

  return (
    <div className={cn(
      "absolute inset-0 transition-opacity duration-1000 ease-in-out",
      isActive ? "opacity-100 z-10" : "opacity-0 z-0"
    )}>
      <Image
        src={imageUrl}
        alt={image.description || 'R & W Property Solutions Project'}
        fill
        className={cn(
          "object-cover transition-all duration-1000",
          isLoaded ? "scale-100 blur-0" : "scale-105 blur-xl"
        )}
        onLoad={() => setIsLoaded(true)}
        priority={isPriority}
        sizes="(max-width: 1280px) 100vw, 1280px"
        quality={95}
      />
      
      <div className="absolute bottom-6 left-6 right-6 md:bottom-10 md:left-10 md:right-auto">
         <div className={cn(
           "transition-all duration-1000 delay-300 transform max-w-xl bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-2xl",
           isActive ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
         )}>
            <h3 className="text-primary font-bold text-xs md:text-sm uppercase tracking-widest mb-2 flex items-center gap-2">
                <span className="w-6 h-1 bg-primary rounded-full" />
                {image.title || 'Project Update'}
            </h3>
            <p className="text-white text-xl md:text-2xl font-headline font-bold leading-tight">
                {image.description || 'Professional property solutions delivered by R & W.'}
            </p>
         </div>
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

  const galleryQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'gallery_images') : null),
    [firestore]
  );
  
  const { data: rawImages, isLoading: areImagesLoading, error: firestoreError } = useCollection<any>(galleryQuery);

  const firestoreImages = useMemo(() => {
    if (!rawImages) return [];
    return [...rawImages].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [rawImages]);

  useEffect(() => {
    if (!firestoreImages || firestoreImages.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % firestoreImages.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [firestoreImages, isPaused]);

  const handleUploadClick = () => {
    inputFileRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !firestore || !storage) return;

    setIsUploading(true);
    toast({ title: 'Processing Photos', description: `Analyzing and uploading ${files.length} project(s)...` });

    const startOrder = firestoreImages.length > 0 
      ? Math.max(...firestoreImages.map((img: any) => img.order || 0)) + 1 
      : 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const compressedBlob = await compressImage(file);
        const cleanName = file.name.replace(/[^a-zA-Z0-9]/g, '_');
        const fileName = `${Date.now()}_${cleanName}`;
        const docId = `upload_${Date.now()}_${i}`;
        
        const storageRef = ref(storage, `gallery_images/${fileName}`);
        await uploadBytes(storageRef, compressedBlob);
        const downloadURL = await getDownloadURL(storageRef);

        const docRef = doc(firestore, 'gallery_images', docId);
        await setDoc(docRef, {
          imageUrl: downloadURL,
          url: downloadURL,
          title: 'New Project',
          description: 'Working hard on property solutions.',
          uploadedAt: serverTimestamp(),
          uploaderUid: user?.uid || 'anonymous',
          order: startOrder + i
        });

        describeImage(downloadURL).then(async (result) => {
          if (result.success && result.description) {
            const parts = result.description.split(':');
            const title = parts.length > 1 ? parts[0].trim() : 'Elite Restoration';
            const desc = parts.length > 1 ? parts.slice(1).join(':').trim() : result.description;

            await updateDoc(docRef, {
              title: title.slice(0, 45),
              description: desc
            });
          }
        });

      } catch (error: any) {
        console.error('Upload Error:', error);
        toast({ 
          variant: 'destructive', 
          title: 'Upload Failed', 
          description: error.message || "Failed to upload image."
        });
      }
    }

    if (inputFileRef.current) inputFileRef.current.value = '';
    setIsUploading(false);
  };

  const nextSlide = useCallback(() => {
    if (firestoreImages.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % firestoreImages.length);
  }, [firestoreImages]);

  const prevSlide = useCallback(() => {
    if (firestoreImages.length === 0) return;
    setCurrentIndex((prev) => (prev === 0 ? firestoreImages.length - 1 : prev - 1));
  }, [firestoreImages]);

  return (
    <section id="gallery" className="w-full bg-background py-20 border-t">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-6 text-center mb-16">
          <div className="space-y-4">
            <h2 className="font-headline text-5xl md:text-6xl font-bold tracking-tight text-foreground">
                Project Showcase
            </h2>
            <p className="text-muted-foreground max-w-2xl text-xl mx-auto">
                A closer look at our property transformations, renovations, and debris removal.
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6">
            <Button
                variant="default"
                onClick={handleUploadClick}
                disabled={isUploading}
                className="rounded-full px-10 h-14 text-lg font-semibold shadow-xl transition-all hover:scale-105"
            >
                {isUploading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <Upload className="mr-2 h-6 w-6" />}
                {isUploading ? 'Uploading...' : 'Add Project Photos'}
            </Button>
            
            <input type="file" ref={inputFileRef} onChange={handleFileChange} className="hidden" accept="image/*" multiple />
          </div>
        </div>

        {firestoreError && (
            <Alert variant="destructive" className="max-w-3xl mx-auto mb-10">
                <AlertCircle className="h-5 w-5" />
                <AlertTitle>Connection Note</AlertTitle>
                <AlertDescription>
                    We are updating the gallery live. Please refresh to see the latest projects.
                </AlertDescription>
            </Alert>
        )}

        <div className="relative group max-w-5xl mx-auto overflow-hidden rounded-[2.5rem] shadow-2xl aspect-square md:aspect-[4/3] bg-muted/20 border-8 border-muted/10" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
        {areImagesLoading ? (
            <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
                <Loader2 className="h-16 w-16 animate-spin text-primary opacity-30" />
                <p className="text-muted-foreground font-medium animate-pulse text-lg">Loading Photos...</p>
            </div>
        ) : firestoreImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-6 p-12 text-center">
                <div className="bg-muted/10 p-10 rounded-full">
                    <ImagePlus className="h-24 w-24 opacity-10" />
                </div>
                <div className="space-y-4">
                    <p className="text-3xl font-bold text-foreground">Gallery Empty</p>
                    <p className="text-lg max-w-md mx-auto">Upload your project photos or run the sync script to populate this showcase.</p>
                </div>
            </div>
        ) : (
            <>
            {firestoreImages.map((image, index) => {
                const isActive = index === currentIndex;
                const isNext = index === (currentIndex + 1) % firestoreImages.length;
                
                if (!isActive && !isNext) return null;

                return (
                <GalleryImage 
                    key={image.id}
                    image={image}
                    isActive={isActive}
                    isPriority={isActive}
                />
                );
            })}

            <button
                onClick={prevSlide}
                className="absolute left-6 top-1/2 -translate-y-1/2 z-20 p-4 rounded-full bg-black/20 hover:bg-primary text-white transition-all opacity-0 group-hover:opacity-100 backdrop-blur-xl border border-white/10"
                aria-label="Previous"
            >
                <ChevronLeft className="h-8 w-8" />
            </button>
            <button
                onClick={nextSlide}
                className="absolute right-6 top-1/2 -translate-y-1/2 z-20 p-4 rounded-full bg-black/20 hover:bg-primary text-white transition-all opacity-0 group-hover:opacity-100 backdrop-blur-xl border border-white/10"
                aria-label="Next"
            >
                <ChevronRight className="h-8 w-8" />
            </button>

            <div className="absolute bottom-6 right-6 z-20 flex gap-2">
                {firestoreImages.map((_, index) => (
                <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={cn(
                    "h-1.5 transition-all duration-700 rounded-full",
                    index === currentIndex ? "w-10 bg-primary shadow-lg" : "w-3 bg-white/30 hover:bg-white/60"
                    )}
                />
                ))}
            </div>

            <div className="absolute top-6 left-6 z-20">
                <div className="px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-white font-bold text-xs tracking-widest">
                    {currentIndex + 1} / {firestoreImages.length}
                </div>
            </div>
            </>
        )}
        </div>
      </div>
    </section>
  );
}
