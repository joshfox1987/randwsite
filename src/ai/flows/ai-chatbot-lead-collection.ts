'use server';

/**
 * @fileOverview An AI chatbot lead collection flow for R & W Property Solutions.
 *
 * - collectLeadInformation - A function that handles the lead collection process.
 * - CollectLeadInformationInput - The input type for the collectLeadInformation function.
 * - CollectLeadInformationOutput - The return type for the collectLeadInformation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getSiteAnalyticsTool } from '@/ai/tools/getSiteAnalytics';

const CollectLeadInformationInputSchema = z.object({
  query: z.string().describe('The user query or message to the chatbot.'),
});
export type CollectLeadInformationInput = z.infer<typeof CollectLeadInformationInputSchema>;

const CollectLeadInformationOutputSchema = z.object({
  response: z.string().describe('The chatbot response to the user query.'),
  name: z.string().optional().describe('The user name.'),
  phoneNumber: z.string().optional().describe('The user phone number.'),
  serviceNeeded: z.string().optional().describe('The service the user needs.'),
  preferredBidTime: z.string().optional().describe('The user preferred bid time.'),
});
export type CollectLeadInformationOutput = z.infer<typeof CollectLeadInformationOutputSchema>;

export async function collectLeadInformation(input: CollectLeadInformationInput): Promise<CollectLeadInformationOutput> {
  return collectLeadInformationFlow(input);
}

const leadCollectionPrompt = ai.definePrompt({
  name: 'leadCollectionPrompt',
  input: {schema: CollectLeadInformationInputSchema},
  output: {schema: CollectLeadInformationOutputSchema},
  tools: [getSiteAnalyticsTool],
  prompt: `You are a helpful AI assistant for R & W Property Solutions. Your job is to answer basic questions about the company's repair and debris removal services and collect lead information from the user.

  If the user asks a question about the company or its services, answer it politely and accurately.

  If the user asks about site statistics or visitor counts, use the provided tool to get the information.

  Politely ask for the following information from the user:
  - Name
  - Phone Number
  - Service Needed
  - Preferred Bid Time

  Try to extract information even if the user does not provide it directly.  Once all information has been collected, respond with a thank you message.

  User Query: {{{query}}}

  Output the response and collected information in JSON format. If a field is not available, leave it blank. Make sure to always respond in JSON format.
  Make sure the response field is a polite and informative response to the user's query, incorporating information about R & W Property Solutions where appropriate.
  {
    "response": "<response to the user's query>",
    "name": "<user's name>",
    "phoneNumber": "<user's phone number>",
    "serviceNeeded": "<service the user needs>",
    "preferredBidTime": "<user's preferred bid time>"
  }`,
});

const collectLeadInformationFlow = ai.defineFlow(
  {
    name: 'collectLeadInformationFlow',
    inputSchema: CollectLeadInformationInputSchema,
    outputSchema: CollectLeadInformationOutputSchema,
  },
  async input => {
    const {output} = await leadCollectionPrompt(input);
    return output!;
  }
);
