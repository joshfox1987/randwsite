'use server';

import { initializeFirebase } from '@/firebase/init';
import { addDoc, collection, doc, getDoc, increment, serverTimestamp, setDoc } from 'firebase/firestore';
import { sendLeadNotificationSms } from './sms';

type Lead = {
    name: string;
    phoneNumber: string;
    leadEmail: string;
    serviceNeeded: string;
    preferredBidTime: string;
}

export async function saveLead(lead: Lead) {
    const { firestore } = initializeFirebase();
    try {
        const leadWithTimestamp = {
            ...lead,
            collectedAt: serverTimestamp(),
        };
        const docRef = await addDoc(collection(firestore, 'leads'), leadWithTimestamp);
        console.log('Lead saved with ID: ', docRef.id);
        
        // Send SMS notification
        await sendLeadNotificationSms(lead);

        return { success: true, id: docRef.id };
    } catch (e) {
        console.error('Error adding document: ', e);
        return { success: false, error: 'Failed to save lead.' };
    }
}

export type ReviewData = {
  name: string;
  rating: number;
  comment: string;
};


export async function saveReview(review: ReviewData) {
    const { firestore } = initializeFirebase();
    try {
        const reviewData = {
            reviewerName: review.name,
            rating: review.rating,
            comment: review.comment,
            submittedAt: serverTimestamp(),
        };
        const docRef = await addDoc(collection(firestore, 'customer_reviews'), reviewData);
        console.log('Review saved with ID: ', docRef.id);
        return { success: true, id: docRef.id };
    } catch (e) {
        console.error('Error adding document: ', e);
        return { success: false, error: 'Failed to save review.' };
    }
}

export async function getVisitorCount(): Promise<number> {
    const { firestore } = initializeFirebase();
    const docRef = doc(firestore, 'site_analytics', 'visitorCounter');
    try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data().visitorCount || 0;
        } else {
            console.log('Visitor counter document does not exist.');
            return 0;
        }
    } catch (error) {
        console.error("Error fetching visitor count:", error);
        // This might happen due to permissions. Return a user-friendly value.
        return -1; // Indicates an error or restricted access
    }
}

export async function incrementVisitorCount() {
    const { firestore } = initializeFirebase();
    const docRef = doc(firestore, 'site_analytics', 'visitorCounter');
    
    try {
        // Use setDoc with merge to create or update the document.
        // This handles the case where the document doesn't exist yet.
        await setDoc(docRef, { visitorCount: increment(1) }, { merge: true });
    } catch (error) {
        // This will now only catch other errors, like permission issues.
        console.error("Error incrementing visitor count: ", error);
    }
}
