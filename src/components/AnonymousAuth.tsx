'use client';

import { useEffect } from 'react';
import { useUser, useAuth } from '@/firebase';
import { signInAnonymously } from 'firebase/auth';
import { Skeleton } from './ui/skeleton';

export function AnonymousAuth({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  useEffect(() => {
    if (!isUserLoading && !user) {
      signInAnonymously(auth).catch((error) => {
        console.error("Anonymous sign-in failed:", error);
      });
    }
  }, [isUserLoading, user, auth]);

  if (isUserLoading) {
    return (
        <div className="flex flex-col min-h-[100dvh] bg-background p-8">
            <Skeleton className="h-20 w-full mb-8" />
            <Skeleton className="flex-1 w-full" />
        </div>
    );
  }

  return <>{children}</>;
}
