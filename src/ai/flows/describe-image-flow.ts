import { ai } from '../genkit';
import { z } from 'zod';

export const describeImageFlow = ai.defineFlow(
  {
    name: 'describeImageFlow',
    inputSchema: z.object({ imageUrl: z.string() }),
    outputSchema: z.string(),
  },
  async (input) => {
    const response = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      prompt: [
        { text: 'Describe this image in a single, professional sentence for a property restoration and debris removal business gallery. Focus on the work done or the quality of the result.' },
        { media: { url: input.imageUrl, contentType: 'image/jpeg' } },
      ],
    });

    return response.text;
  }
);
