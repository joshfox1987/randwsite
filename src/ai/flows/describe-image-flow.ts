import { ai } from '../genkit';
import { z } from 'zod';

export const describeImageFlow = ai.defineFlow(
  {
    name: 'describeImageFlow',
    inputSchema: z.object({ imageUrl: z.string() }),
    outputSchema: z.string(),
  },
  async (input) => {
    try {
      const response = await ai.generate({
        model: 'googleai/gemini-1.5-flash',
        prompt: [
          { text: 'Analyze this image for a property restoration and debris removal business gallery. Provide a response in the format "Title: Description". The title should be a 2-4 word catchy project name. The description should be a professional, high-impact sentence describing the work done or the quality of the result.' },
          { media: { url: input.imageUrl, contentType: 'image/jpeg' } },
        ],
      });

      return response.text;
    } catch (error) {
      console.error('Gemini AI error:', error);
      return 'Project Highlight: Professional property restoration and debris removal service completed with precision.';
    }
  }
);
