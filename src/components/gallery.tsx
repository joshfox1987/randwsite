'use client';
import { useState, useRef, useMemo } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useStorage, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { type ImagePlaceholder } from '@/lib/placeholder-images';

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

  const isUploading = localUploads.some((u) => u.status === 'uploading');

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
    if (!firestore || !storage) return;

    for (const upload of uploads) {
      try {
        // 1. Upload the file to Firebase Storage
        const storageRef = ref(storage, `gallery_images/${Date.now()}_${upload.file.name}`);
        await uploadBytes(storageRef, upload.file);
        
        // 2. Get the download URL
        const downloadURL = await getDownloadURL(storageRef);

        // 3. Save the image metadata to Firestore
        await addDoc(collection(firestore, 'gallery_images'), {
          imageUrl: downloadURL,
          description: upload.file.name,
          imageHint: 'uploaded image',
          uploadedAt: serverTimestamp(),
        });

        // 4. Remove from local uploading state and show success
        setLocalUploads((prev) => prev.filter((u) => u.id !== upload.id));
        toast({
          title: 'Upload Successful',
          description: `${upload.file.name} has been added to the gallery.`,
          action: <CheckCircle className="text-green-500" />,
        });
      } catch (error: any) {
        console.error('Upload process failed:', error);
        
        // Update local state to show the error
        setLocalUploads((prev) =>
          prev.map((u) =>
            u.id === upload.id ? { ...u, status: 'error', error: 'Check permissions & try again.' } : u
          )
        );

        // Show a more specific error toast
        toast({
          variant: 'destructive',
          title: 'Upload Failed',
          description: `Could not save ${upload.file.name}. Please ensure Storage is enabled in your Firebase project and that the security rules are deployed.`,
        });
        
        // Clean up the failed upload from the UI after a delay
        setTimeout(() => {
          setLocalUploads((prev) => prev.filter((u) => u.id !== upload.id));
        }, 5000);
      }
    }
  };

  const galleryImages = useMemo(() => {
    return firestoreImages || [];
  }, [firestoreImages]);

  const renderImage = (image: ImagePlaceholder) => (
    <div key={image.id} className="group relative aspect-video w-full overflow-hidden rounded-lg shadow-lg">
      <Image
        src={image.imageUrl}
        alt={image.description}
        fill
        className="h-full w-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
        style={{ filter: 'contrast(1.1) saturate(1.1) brightness(1.05)' }}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />
    </div>
  );

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

  const renderSkeleton = () => (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[...Array(8)].map((_, i) => (
        <Skeleton key={i} className="aspect-video w-full rounded-lg" />
      ))}
    </div>
  );

  return (
    <section id="gallery" className="w-full bg-background py-24 md:py-32">
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
                {isUploading ? 'Uploading...' : 'Upload Photos'}
              </Button>
              <input
                type="file"
                ref={inputFileRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
                multiple
                disabled={isUploading}
              />
            </div>
          </div>
        </div>
        {areImagesLoading ? (
          renderSkeleton()
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {localUploads.map(renderUploadingImage)}
            {galleryImages.map(renderImage)}
          </div>
        )}
        {!areImagesLoading && galleryImages.length === 0 && localUploads.length === 0 && (
          <div className="text-center text-muted-foreground">
            <p>The gallery is empty. Be the first to upload a photo!</p>
          </div>
        )}
      </div>
    </section>
  );
}
