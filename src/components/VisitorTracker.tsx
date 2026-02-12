'use client';

import { useEffect } from 'react';
import { incrementVisitorCount } from '@/services/firestore';

export function VisitorTracker() {
  useEffect(() => {
    // We only want this to run once per page load.
    const hasBeenCalled = sessionStorage.getItem('visitorCounted');
    if (!hasBeenCalled) {
      incrementVisitorCount();
      sessionStorage.setItem('visitorCounted', 'true');
    }
  }, []);

  // This component doesn't render anything.
  return null;
}
