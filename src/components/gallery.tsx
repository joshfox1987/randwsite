'use client';
import { useState, useRef, useEffect, memo, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, ChevronLeft, ChevronRight, ImagePlus, AlertCircle, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useStorage, useCollection, useUser, useMemoFirebase } from '@/firebase';
import { collection, serverTimestamp, addDoc, updateDoc, doc, deleteDoc, query } from 'firebase/firestore';
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
  // Support both url formats for sync script compatibility
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
          isLoaded ? "scale-100 blur-0" : "scale-110 blur-xl"
        )}
        onLoad={() => setIsLoaded(true)}
        priority={isPriority}
        sizes="100vw"
        quality={95}
      />
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
      
      <div className="absolute bottom-0 left-0 right-0 p-10 md:p-20">
         <div className={cn(
           "transition-all duration-1000 delay-300 transform max-w-4xl",
           isActive ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
         )}>
            <h3 className="text-primary font-bold text-base uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-8 h-1 bg-primary rounded-full" />
                {image.title || 'Project Milestone'}
            </h3>
            <p className="text-white text-3xl md:text-5xl lg:text-6xl font-headline font-bold drop-shadow-2xl leading-tight">
                {image.description || 'Transforming spaces with elite property solutions.'}
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
  const [showAdminControls, setShowAdminControls] = useState(false);

  // We remove orderBy from the query to avoid "Missing Index" errors that look like permission errors.
  // We will sort manually in the component for maximum reliability.
  const galleryQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'gallery_images') : null),
    [firestore]
  );
  
  const { data: rawImages, isLoading: areImagesLoading, error: firestoreError } = useCollection<any>(galleryQuery);

  // Sort images on the client side to avoid Firestore index requirements
  const firestoreImages = useMemo(() => {
    if (!rawImages) return [];
    return [...rawImages].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [rawImages]);

  useEffect(() => {
    if (!firestoreImages || firestoreImages.length <= 1 || isPaused || showAdminControls) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % firestoreImages.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [firestoreImages, isPaused, showAdminControls]);

  const handleUploadClick = () => {
    inputFileRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !firestore || !storage) return;

    setIsUploading(true);
    toast({ title: 'Elevating Photos', description: `Preparing ${files.length} project(s) for the cinematic gallery...` });

    const startOrder = firestoreImages.length > 0 
      ? Math.max(...firestoreImages.map((img: any) => img.order || 0)) + 1 
      : 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const compressedBlob = await compressImage(file);
        const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const storageRef = ref(storage, `gallery_images/${fileName}`);
        
        await uploadBytes(storageRef, compressedBlob);
        const downloadURL = await getDownloadURL(storageRef);

        const docRef = await addDoc(collection(firestore, 'gallery_images'), {
          imageUrl: downloadURL,
          url: downloadURL,
          title: 'New Transformation',
          description: 'A masterpiece in progress by R & W Property Solutions.',
          uploadedAt: serverTimestamp(),
          uploaderUid: user?.uid || 'anonymous',
          order: startOrder + i
        });

        describeImage(downloadURL).then(async (result) => {
          if (result.success && result.description) {
            const parts = result.description.split(':');
            const title = parts.length > 1 ? parts[0].trim() : 'Elite Restoration';
            const desc = parts.length > 1 ? parts.slice(1).join(':').trim() : result.description;

            await updateDoc(doc(firestore, 'gallery_images', docRef.id), {
              title: title.slice(0, 45),
              description: desc
            });
          }
        });

      } catch (error: any) {
        console.error('Upload Error:', error);
        toast({ 
          variant: 'destructive', 
          title: 'Permission Denied?', 
          description: "Database is opening up. If this failed, please try once more."
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

  const deleteImage = async (id: string) => {
    if (!firestore || !window.confirm('Delete this project from gallery?')) return;
    try {
      await deleteDoc(doc(firestore, 'gallery_images', id));
      toast({ title: 'Removed' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error' });
    }
  };

  return (
    <section id="gallery" className="w-full bg-background py-20 border-t">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-6 text-center mb-16">
          <div className="space-y-4">
            <h2 className="font-headline text-5xl md:text-7xl font-bold tracking-tight text-foreground">
                The Cinematic Showcase
            </h2>
            <p className="text-muted-foreground max-w-2xl text-xl mx-auto">
                Explore a high-definition journey through our most impactful property transformations and debris removal projects.
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6">
            <Button
                variant="default"
                onClick={handleUploadClick}
                disabled={isUploading}
                className="rounded-full px-10 h-14 text-lg font-semibold shadow-2xl transition-all hover:scale-105"
            >
                {isUploading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <Upload className="mr-2 h-6 w-6" />}
                {isUploading ? 'Optimizing...' : 'Elevate New Photos'}
            </Button>
            
            <Button
                variant="outline"
                onClick={() => setShowAdminControls(!showAdminControls)}
                className="rounded-full px-10 h-14 text-lg"
            >
                {showAdminControls ? 'View Experience' : 'Manage Gallery'}
            </Button>
            
            <input type="file" ref={inputFileRef} onChange={handleFileChange} className="hidden" accept="image/*" multiple />
          </div>
        </div>

        {firestoreError && (
            <Alert variant="destructive" className="max-w-3xl mx-auto mb-10">
                <AlertCircle className="h-5 w-5" />
                <AlertTitle>Network Alert</AlertTitle>
                <AlertDescription>
                    We are currently re-establishing the database connection. Please refresh to see the latest updates.
                </AlertDescription>
            </Alert>
        )}

        {showAdminControls ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 max-w-7xl mx-auto">
                {firestoreImages.map((image) => (
                    <div key={image.id} className="relative aspect-square rounded-2xl overflow-hidden border-2 bg-muted group shadow-lg">
                        <Image src={image.imageUrl || image.url} alt="" fill className="object-cover" />
                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                            <Button size="icon" variant="destructive" onClick={() => deleteImage(image.id)} className="rounded-full h-12 w-12">
                                <Trash2 className="h-6 w-6" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="relative group max-w-7xl mx-auto overflow-hidden rounded-[2.5rem] shadow-2xl aspect-[16/9] md:aspect-[21/9] bg-black border-8 border-muted/10" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
            {areImagesLoading ? (
                <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="h-16 w-16 animate-spin text-primary opacity-30" />
                    <p className="text-muted-foreground font-medium animate-pulse text-lg">Loading Gallery...</p>
                </div>
            ) : firestoreImages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-6 p-12 text-center">
                    <div className="bg-muted/10 p-10 rounded-full">
                        <ImagePlus className="h-24 w-24 opacity-10" />
                    </div>
                    <div className="space-y-4">
                        <p className="text-3xl font-bold text-foreground">Gallery Sync Required</p>
                        <p className="text-lg max-w-md mx-auto">To see your Storage images here, please run the <code className="bg-muted px-2 py-1 rounded">bash add_images.sh</code> script in your terminal.</p>
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
                    className="absolute left-10 top-1/2 -translate-y-1/2 z-20 p-6 rounded-full bg-black/30 hover:bg-primary text-white transition-all opacity-0 group-hover:opacity-100 backdrop-blur-2xl border border-white/10"
                    aria-label="Previous"
                >
                    <ChevronLeft className="h-10 w-10" />
                </button>
                <button
                    onClick={nextSlide}
                    className="absolute right-10 top-1/2 -translate-y-1/2 z-20 p-6 rounded-full bg-black/30 hover:bg-primary text-white transition-all opacity-0 group-hover:opacity-100 backdrop-blur-2xl border border-white/10"
                    aria-label="Next"
                >
                    <ChevronRight className="h-10 w-10" />
                </button>

                <div className="absolute bottom-10 right-10 z-20 flex gap-3">
                    {firestoreImages.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={cn(
                        "h-2 transition-all duration-700 rounded-full",
                        index === currentIndex ? "w-16 bg-primary shadow-[0_0_20px_rgba(var(--primary),0.8)]" : "w-4 bg-white/20 hover:bg-white/50"
                        )}
                    />
                    ))}
                </div>

                <div className="absolute top-10 left-10 z-20">
                    <div className="px-6 py-2 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 text-white font-bold text-sm tracking-widest">
                        {currentIndex + 1} / {firestoreImages.length}
                    </div>
                </div>
                </>
            )}
            </div>
        )}
      </div>
    </section>
  );
}
