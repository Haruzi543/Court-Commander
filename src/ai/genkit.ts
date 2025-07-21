
/**
 * @fileOverview This file configures and exports the Genkit AI instance.
 *
 * It sets up the necessary plugins (like Google AI) for the entire application.
 * By centralizing the AI initialization, we ensure consistency and avoid
 * re-initializing in multiple places. The exported `ai` object should be
 * used for all Genkit-related operations like defining flows, prompts, and tools.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { GENKIT_ENV } from 'genkit/environment';

// Initialize the Google AI plugin. If a Google AI API key is specified in the
// environment, it will be used.
const googleAiPlugin = googleAI();

// Configure Genkit with the essential plugins.
export const ai = genkit({
  plugins: [googleAiPlugin],
});
