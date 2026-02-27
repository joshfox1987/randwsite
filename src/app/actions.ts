'use server';

import { z } from 'zod';
import { collectLeadInformation } from '@/ai/flows/ai-chatbot-lead-collection';
import type { CollectLeadInformationOutput } from '@/ai/flows/ai-chatbot-lead-collection';
import { saveLead, saveReview } from '@/services/firestore';
import { describeImageFlow } from '@/ai/flows/describe-image-flow';

const reviewSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  rating: z.coerce.number().min(1, "Rating is required.").max(5),
  comment: z.string().min(10, 'Comment must be at least 10 characters.'),
});

export type Review = z.infer<typeof reviewSchema>;

export async function submitReview(data: Review) {
  const result = reviewSchema.safeParse(data);
  if (!result.success) {
    return { success: false, error: result.error.flatten().fieldErrors };
  }

  // Save to Firestore
  const firestoreResult = await saveReview(result.data);

  if (!firestoreResult.success) {
      // This is a server error, so we'll just return a generic form error.
      return { success: false, error: { form: ['Sorry, there was an error submitting your review.'] } };
  }

  // Return success. The client-side will update via the real-time listener.
  return { success: true, data: result.data };
}

export async function sendChatMessage(
  history: { text: string; role: 'user' | 'model' }[],
): Promise<CollectLeadInformationOutput> {
  const query = history.map(h => `${h.role}: ${h.text}`).join('\n');
  const aiResponse = await collectLeadInformation({ query });

  // If a lead was successfully collected, save it.
  if (aiResponse.name && aiResponse.phoneNumber && aiResponse.leadEmail && aiResponse.serviceNeeded) {
    await saveLead({
        name: aiResponse.name,
        phoneNumber: aiResponse.phoneNumber,
        leadEmail: aiResponse.leadEmail,
        serviceNeeded: aiResponse.serviceNeeded,
        preferredBidTime: aiResponse.preferredBidTime || '',
    });
  }

  return aiResponse;
}

export async function describeImage(imageUrl: string) {
  try {
    const description = await describeImageFlow({ imageUrl });
    return { success: true, description };
  } catch (error) {
    console.error('Error describing image:', error);
    return { success: false, error: 'Failed to describe image' };
  }
}
