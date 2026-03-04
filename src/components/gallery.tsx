'use client';
import { useState, useRef, useEffect, memo, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, ChevronLeft, ChevronRight, ImagePlus, AlertCircle, Trash2, Eraser } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useStorage, useCollection, useUser, useMemoFirebase } from '@/firebase';
import { collection, serverTimestamp, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { describeImage } from '@/app/actions';

// Image compression utility - Optimized for mobile/desktop balance
const compressImage = (file: File, maxWidth = 1200, quality = 0.85): Promise<Blob> => {
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
          isLoaded ? "scale-100 blur-0" : "scale-105 blur-lg"
        )}
        onLoad={() => setIsLoaded(true)}
        priority={isPriority}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
        quality={85}
      />
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none" />
      
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
         <div className={cn(
           "transition-all duration-1000 delay-300 transform max-w-2xl",
           isActive ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
         )}>
            <h3 className="text-primary font-bold text-xs md:text-sm uppercase tracking-[0.2em] mb-2 md:mb-3 flex items-center gap-2">
                <span className="w-6 h-0.5 bg-primary rounded-full" />
                {image.title || 'Project Milestone'}
            </h3>
            <p className="text-white text-xl md:text-3xl lg:text-4xl font-headline font-bold drop-shadow-2xl leading-tight">
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
    if (!firestoreImages || firestoreImages.length <= 1 || isPaused || showAdminControls) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % firestoreImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [firestoreImages, isPaused, showAdminControls]);

  const handleUploadClick = () => {
    inputFileRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !firestore || !storage) return;

    setIsUploading(true);
    toast({ title: 'Optimizing for Mobile', description: `Processing ${files.length} project(s)...` });

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
          title: 'Project Update',
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
          title: 'Upload Failed', 
          description: "Something went wrong. Please try again."
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

  const clearGallery = async () => {
    if (!firestore || !window.confirm('Wipe out entire gallery?')) return;
    setIsUploading(true);
    try {
      const deletePromises = firestoreImages.map(img => deleteDoc(doc(firestore, 'gallery_images', img.id)));
      await Promise.all(deletePromises);
      toast({ title: 'Gallery Reset' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Reset Failed' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <section id="gallery" className="w-full bg-background py-12 md:py-20 border-t">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-10 md:mb-16">
          <div className="space-y-2">
            <h2 className="font-headline text-4xl md:text-6xl font-bold tracking-tight text-foreground">
                Project Gallery
            </h2>
            <p className="text-muted-foreground max-w-xl text-lg md:text-xl mx-auto">
                A showcase of our restoration and debris removal expertise.
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Button
                variant="default"
                onClick={handleUploadClick}
                disabled={isUploading}
                className="rounded-full px-8 h-12 text-base font-semibold transition-all hover:scale-105"
            >
                {isUploading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Upload className="mr-2 h-5 w-5" />}
                {isUploading ? 'Processing...' : 'Add Photos'}
            </Button>
            
            <div className="flex gap-2">
              <Button
                  variant="outline"
                  onClick={() => setShowAdminControls(!showAdminControls)}
                  className="rounded-full px-8 h-12 text-base"
              >
                  {showAdminControls ? 'View Gallery' : 'Manage'}
              </Button>
              {showAdminControls && (
                 <Button
                    variant="destructive"
                    onClick={clearGallery}
                    disabled={isUploading}
                    className="rounded-full px-4 h-12"
                    title="Clear Gallery"
                >
                    <Eraser className="h-5 w-5" />
                </Button>
              )}
            </div>
            
            <input type="file" ref={inputFileRef} onChange={handleFileChange} className="hidden" accept="image/*" multiple />
          </div>
        </div>

        {showAdminControls ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6 max-w-6xl mx-auto">
                {firestoreImages.map((image) => (
                    <div key={image.id} className="relative aspect-square rounded-xl overflow-hidden border shadow-sm group">
                        <Image src={image.imageUrl || image.url} alt="" fill className="object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button size="icon" variant="destructive" onClick={() => deleteImage(image.id)} className="rounded-full h-10 w-10">
                                <Trash2 className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="relative group max-w-4xl mx-auto overflow-hidden rounded-2xl md:rounded-[2rem] shadow-xl aspect-square md:aspect-video bg-black border-4 md:border-8 border-muted/10" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
            {areImagesLoading ? (
                <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary opacity-30" />
                </div>
            ) : firestoreImages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-4 p-8 text-center">
                    <ImagePlus className="h-16 w-16 opacity-10" />
                    <p className="text-xl font-bold text-foreground">Gallery is empty</p>
                    <p className="text-sm">Upload photos or run sync to see them here.</p>
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
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 md:p-5 rounded-full bg-black/20 hover:bg-primary text-white transition-all opacity-0 group-hover:opacity-100 backdrop-blur-xl border border-white/5"
                    aria-label="Previous"
                >
                    <ChevronLeft className="h-6 w-6 md:h-8 md:h-8" />
                </button>
                <button
                    onClick={nextSlide}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 md:p-5 rounded-full bg-black/20 hover:bg-primary text-white transition-all opacity-0 group-hover:opacity-100 backdrop-blur-xl border border-white/5"
                    aria-label="Next"
                >
                    <ChevronRight className="h-6 w-6 md:h-8 md:h-8" />
                </button>

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2 md:gap-3">
                    {firestoreImages.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={cn(
                        "h-1.5 transition-all duration-700 rounded-full",
                        index === currentIndex ? "w-8 md:w-12 bg-primary shadow-lg" : "w-1.5 md:w-3 bg-white/20"
                        )}
                    />
                    ))}
                </div>

                <div className="absolute top-4 right-4 z-20">
                    <div className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white text-[10px] md:text-xs font-bold tracking-widest">
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
