'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, AlertTriangle, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useStorage, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { PlaceHolderImages, type ImagePlaceholder } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';

type UploadStatus = 'uploading' | 'error' | 'success';
type UploadingImage = {
  id: string;
  file: File;
  status: UploadStatus;
  error?: string;
};

export default function Gallery() {
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const inputFileRef = useRef<HTMLInputElement>(null);

  const [localUploads, setLocalUploads] = useState<UploadingImage[]>([]);

  const galleryQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'gallery_images'), orderBy('uploadedAt', 'desc')) : null),
    [firestore]
  );
  const { data: firestoreImages, isLoading: areImagesLoading } = useCollection<ImagePlaceholder>(galleryQuery);

  const allImages = useMemo(() => {
    const combined = [...PlaceHolderImages, ...(firestoreImages || [])];
    const uniqueImages = Array.from(new Map(combined.map(item => [item.imageUrl, item])).values());
    return uniqueImages;
  }, [firestoreImages]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isUploading = localUploads.some((u) => u.status === 'uploading');

  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  useEffect(() => {
    if (allImages.length < 2) return;
    resetTimeout();
    timeoutRef.current = setTimeout(
      () => setCurrentIndex((prevIndex) => (prevIndex === allImages.length - 1 ? 0 : prevIndex + 1)),
      5000 // Change image every 5 seconds
    );
    return () => {
      resetTimeout();
    };
  }, [currentIndex, allImages.length]);

  const goToPrevious = () => {
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? allImages.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToNext = () => {
    const isLastSlide = currentIndex === allImages.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  const handleUploadClick = () => {
    inputFileRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newUploads: UploadingImage[] = Array.from(files).map((file) => ({
      id: `uploading-${Date.now()}-${file.name}`,
      file,
      status: 'uploading',
    }));

    setLocalUploads((prev) => [...newUploads, ...prev]);
    processUploads(newUploads);
  };

  const processUploads = async (uploads: UploadingImage[]) => {
    if (!firestore || !storage) {
       toast({
          variant: 'destructive',
          title: 'Upload Failed',
          description: 'Firebase services are not available. Please try again later.',
        });
      return;
    }

    for (const upload of uploads) {
      try {
        const storageRef = ref(storage, `gallery_images/${Date.now()}_${upload.file.name}`);
        await uploadBytes(storageRef, upload.file);
        const downloadURL = await getDownloadURL(storageRef);

        await addDoc(collection(firestore, 'gallery_images'), {
          imageUrl: downloadURL,
          description: upload.file.name,
          imageHint: 'uploaded image',
          uploadedAt: serverTimestamp(),
        });

        setLocalUploads((prev) => prev.filter((u) => u.id !== upload.id));
        toast({
          title: 'Upload Successful',
          description: `${upload.file.name} has been added to the gallery.`,
          action: <CheckCircle className="text-green-500" />,
        });
      } catch (error: any) {
        console.error('Upload process failed:', error);
        setLocalUploads((prev) =>
          prev.map((u) =>
            u.id === upload.id ? { ...u, status: 'error', error: 'Upload failed. Check permissions.' } : u
          )
        );
        toast({
          variant: 'destructive',
          title: 'Upload Failed',
          description: `Could not save ${upload.file.name}. Please check Storage security rules and ensure the service is enabled.`,
        });
        setTimeout(() => {
          setLocalUploads((prev) => prev.filter((u) => u.id !== upload.id));
        }, 5000);
      }
    }
  };
  
  const renderUploadingImage = (upload: UploadingImage) => (
    <div key={upload.id} className="relative aspect-video w-full overflow-hidden rounded-lg shadow-lg">
      <Image
        src={URL.createObjectURL(upload.file)}
        alt={upload.file.name}
        fill
        className="h-full w-full object-cover"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 p-4 text-center text-white">
        {upload.status === 'uploading' && <Loader2 className="h-8 w-8 animate-spin" />}
        {upload.status === 'error' && <AlertTriangle className="h-8 w-8 text-destructive" />}
        <p className="mt-2 text-sm font-semibold">
          {upload.status === 'uploading'
            ? 'Uploading...'
            : `Upload Failed ${upload.error ? ` - ${upload.error}` : ''}`}
        </p>
      </div>
    </div>
  );

  return (
    <section id="gallery" className="w-full bg-background py-24 md:py-32">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="mb-8 w-full">
            <div className="relative flex items-center justify-center">
              <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-5xl">
                Our Work
              </h2>
              <Button
                variant="outline"
                className="absolute right-0 top-1/2 -translate-y-1/2"
                onClick={handleUploadClick}
                disabled={isUploading}
              >
                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                {isUploading ? 'Uploading...' : 'Upload Photos'}
              </Button>
              <input type="file" ref={inputFileRef} onChange={handleFileChange} className="hidden" accept="image/*" multiple disabled={isUploading} />
            </div>
          </div>
        </div>

        {areImagesLoading ? (
           <Skeleton className="aspect-video w-full rounded-lg" />
        ) : allImages.length === 0 && localUploads.length === 0 ? (
          <div className="text-center text-muted-foreground py-16">
            <p className="text-lg">The gallery is currently empty.</p>
            <p className="mt-2">Be the first to upload a photo of completed work!</p>
          </div>
        ) : (
          <div className="relative h-[60vh] w-full rounded-lg overflow-hidden shadow-2xl">
             {allImages.length > 1 && (
                <>
                    <Button onClick={goToPrevious} variant="ghost" size="icon" className="absolute left-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-black/30 hover:bg-black/50 text-white">
                        <ChevronLeft className="h-8 w-8" />
                    </Button>
                    <Button onClick={goToNext} variant="ghost" size="icon" className="absolute right-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-black/30 hover:bg-black/50 text-white">
                        <ChevronRight className="h-8 w-8" />
                    </Button>
                </>
             )}
            
            {allImages.map((image, index) => (
              <div
                key={image.id || image.imageUrl}
                className={cn(
                  'absolute inset-0 transition-opacity duration-1000 ease-in-out',
                  index === currentIndex ? 'opacity-100' : 'opacity-0'
                )}
              >
                <Image
                  src={image.imageUrl}
                  alt={image.description}
                  fill
                  className="object-cover"
                  style={{ filter: 'contrast(1.1) saturate(1.1) brightness(1.05)' }}
                  sizes="100vw"
                  priority={index === 0}
                />
                 <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                  <p className="text-white text-center text-sm md:text-base">{image.description}</p>
                </div>
              </div>
            ))}
            
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {allImages.map((_, index) => (
                <div
                  key={`dot-${index}`}
                  onClick={() => setCurrentIndex(index)}
                  className={cn(
                    'h-3 w-3 rounded-full cursor-pointer transition-colors',
                    currentIndex === index ? 'bg-white' : 'bg-white/50 hover:bg-white/75'
                  )}
                />
              ))}
            </div>
          </div>
        )}

        {localUploads.length > 0 && (
            <div className="mt-8">
                <h3 className="text-xl font-headline font-semibold mb-4 text-center">Your Uploads</h3>
                 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {localUploads.map(renderUploadingImage)}
                 </div>
            </div>
        )}

      </div>
    </section>
  );
}
