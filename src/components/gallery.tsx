'use client';
import { useState, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, X, ImagePlus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useStorage, useCollection, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
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
  
  const { data: firestoreImages, isLoading: areImagesLoading } = useCollection<any>(galleryQuery);

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

    if (inputFileRef.current) {
        inputFileRef.current.value = '';
    }
    setIsUploading(false);
  };
  
  const handleDelete = async (image: any) => {
    if (!firestore || !storage || !image.id) {
        toast({ variant: 'destructive', title: 'Delete Failed', description: 'Cannot delete image.' });
        return;
    }
    try {
        await deleteDoc(doc(firestore, 'gallery_images', image.id));
        
        if (image.storagePath) {
            const storageRef = ref(storage, image.storagePath);
            await deleteObject(storageRef);
        }

        toast({ title: 'Delete Successful', description: 'Image has been removed from the gallery.' });
    } catch (error) {
        console.error('Delete failed:', error);
        toast({ variant: 'destructive', title: 'Delete Failed', description: 'Could not delete image.' });
    }
  };

  const isAuthenticating = isAuthLoading;
  const uploadButtonText = isAuthenticating ? 'Authenticating...' : (isUploading ? 'Uploading...' : 'Upload Photos');

  return (
    <section id="gallery" className="w-full bg-background py-24 md:py-32">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="mb-8 w-full">
            <div className="relative flex items-center justify-center flex-col md:flex-row gap-4">
              <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-5xl">
                Our Gallery
              </h2>
              {user && (
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
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
                </div>
              )}
            </div>
          </div>
        </div>

        {areImagesLoading ? (
            <div className="w-full flex justify-center">
                <Skeleton className="aspect-video w-full max-w-4xl rounded-lg" />
            </div>
        ) : !firestoreImages || firestoreImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-xl bg-muted/20">
                <ImagePlus className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-lg">Your gallery is currently empty.</p>
                {user && <p className="text-sm text-muted-foreground mt-2">Use the button above to upload your first project photos!</p>}
            </div>
        ) : (
          <Carousel className="w-full max-w-4xl mx-auto">
            <CarouselContent>
              {firestoreImages.map((image) => (
                <CarouselItem key={image.id}>
                  <div className="p-1">
                    <Card className="overflow-hidden bg-black border-none shadow-2xl">
                      <CardContent className="relative flex aspect-video items-center justify-center p-0">
                        <Image
                            src={image.imageUrl || image.url}
                            alt={image.description || 'Property Solution Project'}
                            fill
                            className="object-cover transition-all duration-700 hover:scale-105"
                            sizes="(max-width: 1024px) 100vw, 1024px"
                            priority
                        />
                        {user && (image.uploaderUid === user.uid || !image.uploaderUid) && (
                           <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-4 right-4 h-10 w-10 z-10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleDelete(image)}
                           >
                                <X className="h-5 w-5" />
                           </Button>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                            <p className="text-white font-medium text-lg">{image.description || 'Completed Project'}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex -left-16" />
            <CarouselNext className="hidden md:flex -right-16" />
          </Carousel>
        )}
      </div>
    </section>
  );
}
