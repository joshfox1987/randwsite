'use server';

import { initializeFirebase } from '@/firebase';
import { addDoc, collection, doc, getDoc, increment, serverTimestamp, setDoc } from 'firebase/firestore';
import { sendLeadNotificationSms } from './sms';

type Lead = {
    name: string;
    phoneNumber: string;
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
        // Use updateDoc with increment, which is atomic.
        // This will fail if the document doesn't exist, which is intended by the security rules.
        await setDoc(docRef, { visitorCount: increment(1) }, { merge: true });
    } catch (error) {
        // Check if the document does not exist to create it.
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            await setDoc(docRef, { visitorCount: 1 });
        } else {
             console.error("Error incrementing visitor count: ", error);
        }
    }
}
