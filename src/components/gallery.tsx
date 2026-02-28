'use client';
import { useState, useRef, useEffect, memo, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, ChevronLeft, ChevronRight, ImagePlus, AlertCircle, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useStorage, useCollection, useUser, useMemoFirebase } from '@/firebase';
import { collection, serverTimestamp, addDoc, updateDoc, doc, deleteDoc, query, orderBy, limit } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { describeImage } from '@/app/actions';

// Image compression utility
const compressImage = (file: File, maxWidth = 1280, quality = 0.8): Promise<Blob> => {
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
            else reject(new Error('Canvas to Blob failed'));
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
      "absolute inset-0 transition-opacity duration-700 ease-in-out",
      isActive ? "opacity-100 z-10" : "opacity-0 z-0"
    )}>
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
        quality={85}
      />
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
      
      <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
         <div className={cn(
           "transition-all duration-700 delay-100 transform",
           isActive ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
         )}>
            <h3 className="text-primary font-bold text-sm uppercase tracking-widest mb-2">
                {image.title || 'Project Highlight'}
            </h3>
            <p className="text-white text-2xl md:text-4xl font-headline font-bold drop-shadow-2xl max-w-3xl">
                {image.description || 'Transforming properties with precision and care.'}
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

  // Memoize the gallery query - ordered by our custom 'order' field
  const galleryQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'gallery_images'), orderBy('order', 'asc')) : null),
    [firestore]
  );
  
  const { data: firestoreImages, isLoading: areImagesLoading, error: firestoreError } = useCollection<any>(galleryQuery);

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
    toast({ title: 'Processing Images', description: `Optimizing and uploading ${files.length} image(s)...` });

    const batchId = Date.now();
    const startOrder = firestoreImages && firestoreImages.length > 0 
      ? Math.max(...firestoreImages.map((img: any) => img.order || 0)) + 1 
      : 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        // Step 1: Compress image
        const compressedBlob = await compressImage(file);
        
        // Step 2: Upload to Storage
        const timestamp = Date.now();
        const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const storageRef = ref(storage, `gallery_images/${fileName}`);
        
        await uploadBytes(storageRef, compressedBlob);
        const downloadURL = await getDownloadURL(storageRef);

        // Step 3: Create Firestore Document
        const docRef = await addDoc(collection(firestore, 'gallery_images'), {
          imageUrl: downloadURL,
          url: downloadURL,
          title: 'New Project',
          description: 'R & W Property Solutions Project',
          uploadedAt: serverTimestamp(),
          uploaderUid: user?.uid || 'anonymous',
          order: startOrder + i,
          batchId: batchId
        });

        // Step 4: Trigger AI Description
        describeImage(downloadURL).then(async (result) => {
          if (result.success && result.description) {
            // Split AI response into title and description if possible
            const parts = result.description.split(':');
            const title = parts.length > 1 ? parts[0].trim() : 'Project Update';
            const desc = parts.length > 1 ? parts.slice(1).join(':').trim() : result.description;

            await updateDoc(doc(firestore, 'gallery_images', docRef.id), {
              title: title.slice(0, 40),
              description: desc
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
    toast({ title: 'Upload Complete', description: 'Your photos are optimized and live.' });
  };

  const nextSlide = useCallback(() => {
    if (!firestoreImages) return;
    setCurrentIndex((prev) => (prev + 1) % firestoreImages.length);
  }, [firestoreImages]);

  const prevSlide = useCallback(() => {
    if (!firestoreImages) return;
    setCurrentIndex((prev) => (prev === 0 ? firestoreImages.length - 1 : prev - 1));
  }, [firestoreImages]);

  const moveImage = async (index: number, direction: 'up' | 'down') => {
    if (!firestoreImages || !firestore) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= firestoreImages.length) return;

    const imgA = firestoreImages[index];
    const imgB = firestoreImages[newIndex];

    const tempOrder = imgA.order;
    await updateDoc(doc(firestore, 'gallery_images', imgA.id), { order: imgB.order });
    await updateDoc(doc(firestore, 'gallery_images', imgB.id), { order: tempOrder });
    
    if (currentIndex === index) setCurrentIndex(newIndex);
    else if (currentIndex === newIndex) setCurrentIndex(index);
  };

  const deleteImage = async (id: string) => {
    if (!firestore || !window.confirm('Are you sure you want to delete this image?')) return;
    try {
      await deleteDoc(doc(firestore, 'gallery_images', id));
      toast({ title: 'Image Deleted' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Delete Failed' });
    }
  };

  return (
    <section id="gallery" className="w-full bg-background py-16 md:py-24 border-t overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <div className="space-y-2">
            <h2 className="font-headline text-4xl font-bold tracking-tighter sm:text-6xl bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Spectacular Results
            </h2>
            <p className="text-muted-foreground max-w-[700px] text-lg">
                Witness the transformation. Our AI-powered gallery showcases the precision and dedication we bring to every property.
            </p>
          </div>
          
          <div className="pt-4 flex flex-wrap justify-center gap-4">
            <Button
                variant="default"
                onClick={handleUploadClick}
                disabled={isUploading}
                className="rounded-full px-8 h-12 transition-all hover:scale-105 shadow-xl bg-primary hover:bg-primary/90"
            >
                {isUploading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                    <Upload className="mr-2 h-5 w-5" />
                )}
                {isUploading ? 'Optimizing...' : 'Upload New Photos'}
            </Button>
            
            <Button
                variant="outline"
                onClick={() => setShowAdminControls(!showAdminControls)}
                className="rounded-full px-8 h-12 transition-all"
            >
                {showAdminControls ? 'View Gallery' : 'Reorder Photos'}
            </Button>
            
            <input type="file" ref={inputFileRef} onChange={handleFileChange} className="hidden" accept="image/*" multiple />
          </div>
        </div>

        {firestoreError && (
            <Alert variant="destructive" className="max-w-2xl mx-auto mb-8">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Connection Issue</AlertTitle>
                <AlertDescription>
                    Unable to reach the gallery database. Please refresh to reconnect.
                </AlertDescription>
            </Alert>
        )}

        {showAdminControls ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 max-w-6xl mx-auto">
                {firestoreImages?.map((image, index) => (
                    <div key={image.id} className="relative aspect-square rounded-lg overflow-hidden border bg-muted group">
                        <Image src={image.imageUrl || image.url} alt="" fill className="object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                            <div className="flex gap-2">
                                <Button size="icon" variant="secondary" onClick={() => moveImage(index, 'up')} disabled={index === 0}>
                                    <ArrowUp className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="secondary" onClick={() => moveImage(index, 'down')} disabled={index === (firestoreImages?.length || 0) - 1}>
                                    <ArrowDown className="h-4 w-4" />
                                </Button>
                            </div>
                            <Button size="icon" variant="destructive" onClick={() => deleteImage(image.id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="relative group max-w-6xl mx-auto overflow-hidden rounded-3xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] aspect-[16/9] md:aspect-[21/9] bg-neutral-950 border-4 border-muted/20" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
            {areImagesLoading ? (
                <div className="w-full h-full flex items-center justify-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
                </div>
            ) : !firestoreImages || firestoreImages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-4 p-8 text-center">
                <ImagePlus className="h-20 w-20 opacity-10" />
                <div className="space-y-4">
                    <p className="text-xl font-semibold">Our Portfolio is Growing</p>
                    <p className="text-sm max-w-xs mx-auto">Upload your first project photos to see them showcased in this cinematic gallery.</p>
                </div>
                </div>
            ) : (
                <>
                {firestoreImages.map((image, index) => {
                    const isActive = index === currentIndex;
                    // Preload next and prev for smooth transitions
                    const isNext = index === (currentIndex + 1) % firestoreImages.length;
                    const isPrev = index === (currentIndex - 1 + firestoreImages.length) % firestoreImages.length;
                    
                    if (!isActive && !isNext && !isPrev) return null;

                    return (
                    <GalleryImage 
                        key={image.id}
                        image={image}
                        isActive={isActive}
                        isPriority={isActive || isNext}
                    />
                    );
                })}

                <button
                    onClick={prevSlide}
                    className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 p-4 rounded-full bg-black/20 hover:bg-primary text-white transition-all opacity-0 group-hover:opacity-100 backdrop-blur-xl border border-white/10"
                    aria-label="Previous"
                >
                    <ChevronLeft className="h-8 w-8" />
                </button>
                <button
                    onClick={nextSlide}
                    className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 p-4 rounded-full bg-black/20 hover:bg-primary text-white transition-all opacity-0 group-hover:opacity-100 backdrop-blur-xl border border-white/10"
                    aria-label="Next"
                >
                    <ChevronRight className="h-8 w-8" />
                </button>

                <div className="absolute bottom-8 right-8 z-20 flex gap-2">
                    {firestoreImages.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={cn(
                        "h-1.5 transition-all duration-500 rounded-full",
                        index === currentIndex ? "w-12 bg-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]" : "w-3 bg-white/20 hover:bg-white/40"
                        )}
                    />
                    ))}
                </div>

                <div className="absolute top-8 left-8 z-20">
                    <div className="px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/80 text-xs font-medium">
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
