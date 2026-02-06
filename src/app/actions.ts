
'use server';

import { z } from 'zod';
import { collectLeadInformation } from '@/ai/flows/ai-chatbot-lead-collection';
import type { CollectLeadInformationOutput } from '@/ai/flows/ai-chatbot-lead-collection';
import { enhanceImage } from '@/ai/flows/enhance-image-flow';

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

  // In a real app, you would save this to a Firestore collection.
  console.log('New Review Submitted:', result.data);
  // We will return the validated data to be added to the client-side state for this demo.
  return { success: true, data: result.data };
}

export async function sendChatMessage(
  history: { text: string; role: 'user' | 'model' }[],
): Promise<CollectLeadInformationOutput> {
  const query = history.map(h => `${h.role}: ${h.text}`).join('\n');
  const aiResponse = await collectLeadInformation({ query });
  return aiResponse;
}

export async function enhanceUploadedImage(dataUri: string): Promise<string> {
  const result = await enhanceImage({
    photoDataUri: dataUri,
    prompt:
      'Enhance this image to look more professional by improving lighting, colors, and overall quality. Clean up any minor imperfections like scratches or blemishes. The result should be a high-quality photograph suitable for a company website.',
  });
  return result.enhancedPhotoDataUri;
}
