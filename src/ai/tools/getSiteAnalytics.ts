'use server';

import { ai } from '@/ai/genkit';
import { getVisitorCount } from '@/services/firestore';
import { z } from 'zod';

export const getSiteAnalyticsTool = ai.defineTool(
  {
    name: 'getSiteAnalytics',
    description: 'Get statistics about the website, like visitor count.',
    inputSchema: z.object({}),
    outputSchema: z.object({
      visitorCount: z.number(),
    }),
  },
  async () => {
    const visitorCount = await getVisitorCount();
    return { visitorCount };
  }
);
