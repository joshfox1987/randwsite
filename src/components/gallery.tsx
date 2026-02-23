'use client';
import { useState, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useStorage, useCollection, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { PlaceHolderImages, type ImagePlaceholder } from '@/lib/placeholder-images';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Card, CardContent } from "@/components/ui/card"


export default function Gallery() {
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const inputFileRef = useRef<HTMLInputElement>(null);
  const { user, isUserLoading: isAuthLoading } = useUser();

  const [isUploading, setIsUploading] = useState(false);

  const galleryQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'gallery_images'), orderBy('uploadedAt', 'desc')) : null),
    [firestore]
  );
  const { data: firestoreImages, isLoading: areImagesLoading } = useCollection<ImagePlaceholder>(galleryQuery);

  // The default team photo is now the only placeholder.
  const allImages = [ ...PlaceHolderImages, ...(firestoreImages || []) ];

  const handleUploadClick = () => {
    inputFileRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !firestore || !storage || !user) {
        toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not upload. Please try again.' });
        return;
    };

    setIsUploading(true);

    for (const file of Array.from(files)) {
      try {
        const storageRef = ref(storage, `gallery_images/${user.uid}/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);

        await addDoc(collection(firestore, 'gallery_images'), {
          imageUrl: downloadURL,
          description: file.name,
          imageHint: 'uploaded image',
          uploadedAt: serverTimestamp(),
          uploaderUid: user.uid,
          storagePath: storageRef.fullPath,
        });

        toast({ title: 'Upload Successful', description: `${file.name} has been added to the gallery.` });
      } catch (error) {
        console.error('Upload failed:', error);
        toast({ variant: 'destructive', title: 'Upload Failed', description: `Could not upload ${file.name}. Please check permissions and try again.` });
      }
    }

    // Reset file input
    if (inputFileRef.current) {
        inputFileRef.current.value = '';
    }
    setIsUploading(false);
  };
  
  const handleDelete = async (image: ImagePlaceholder & { storagePath?: string, id?: string }) => {
    if (!firestore || !storage || !image.id || !image.storagePath) {
        toast({ variant: 'destructive', title: 'Delete Failed', description: 'Cannot delete image. Information missing.' });
        return;
    }
    try {
        // Delete from Firestore
        await deleteDoc(doc(firestore, 'gallery_images', image.id));
        
        // Delete from Storage
        const storageRef = ref(storage, image.storagePath);
        await deleteObject(storageRef);

        toast({ title: 'Delete Successful', description: 'Image has been removed from the gallery.' });
    } catch (error) {
        console.error('Delete failed:', error);
        toast({ variant: 'destructive', title: 'Delete Failed', description: 'Could not delete image. Please check permissions.' });
    }
  };


  const isAuthenticating = isAuthLoading;
  const uploadButtonText = isAuthenticating ? 'Authenticating...' : (isUploading ? 'Uploading...' : 'Upload Photos');

  return (
    <section id="gallery" className="w-full bg-background py-24 md:py-32">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="mb-8 w-full">
            <div className="relative flex items-center justify-center">
              <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-5xl">
                Our Work
              </h2>
              {user && (
                <>
                <Button
                    variant="outline"
                    className="absolute right-0 top-1/2 -translate-y-1/2"
                    onClick={handleUploadClick}
                    disabled={isUploading || isAuthenticating}
                >
                    {isUploading || isAuthenticating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                    <Upload className="mr-2 h-4 w-4" />
                    )}
                    {uploadButtonText}
                </Button>
                <input type="file" ref={inputFileRef} onChange={handleFileChange} className="hidden" accept="image/*" multiple disabled={isUploading || isAuthenticating} />
                </>
              )}
            </div>
          </div>
        </div>

        {areImagesLoading ? (
            <div className="w-full flex justify-center">
                <Skeleton className="aspect-video w-full max-w-4xl rounded-lg" />
            </div>
        ) : (
          <Carousel className="w-full max-w-4xl mx-auto" autoPlay>
            <CarouselContent>
              {allImages.map((image) => (
                <CarouselItem key={image.imageUrl}>
                  <div className="p-1">
                    <Card className="overflow-hidden">
                      <CardContent className="relative flex aspect-video items-center justify-center p-0">
                        <Image
                            src={image.imageUrl}
                            alt={image.description}
                            fill
                            className="object-cover"
                            sizes="(max-width: 1024px) 100vw, 1024px"
                        />
                        {user && (image as any).uploaderUid === user.uid && (
                           <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 h-8 w-8 z-10"
                                onClick={() => handleDelete(image as any)}
                           >
                                <X className="h-4 w-4" />
                           </Button>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-[-50px]" />
            <CarouselNext className="right-[-50px]" />
          </Carousel>
        )}
      </div>
    </section>
  );
}
