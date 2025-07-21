
'use server';

/**
 * @fileOverview A flow to generate and "send" an OTP for user verification.
 * 
 * - sendOtp - A function that generates a 6-digit OTP and simulates sending it.
 * - SendOtpInput - The input type for the sendOtp function.
 * - SendOtpOutput - The return type for the sendOtp function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Define the schema for the input of the OTP flow
const SendOtpInputSchema = z.object({
  firstName: z.string().describe('The first name of the user.'),
  lastName: z.string().describe('The last name of the user.'),
  email: z.string().email().describe('The email address of the user.'),
  otp: z.string().length(6).describe('The 6-digit one-time password.'),
});
export type SendOtpInput = z.infer<typeof SendOtpInputSchema>;


// Define the schema for the output of the OTP flow
const SendOtpOutputSchema = z.object({
  otp: z.string().length(6).describe('The 6-digit one-time password.'),
  emailBody: z.string().describe('The full body content of the email to be sent.'),
});
export type SendOtpOutput = z.infer<typeof SendOtpOutputSchema>;


// Exported wrapper function that calls the Genkit flow
export async function sendOtp(input: Omit<SendOtpInput, 'otp'>): Promise<SendOtpOutput> {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  return sendOtpFlow({ ...input, otp });
}


// Define the Genkit prompt for generating the OTP and email content
const sendOtpPrompt = ai.definePrompt({
    name: 'sendOtpPrompt',
    input: { schema: SendOtpInputSchema },
    output: { schema: SendOtpOutputSchema },
    prompt: `
      You are an authentication assistant for an app named "Court Commander".
      Your task is to generate an email body for user verification using the provided One-Time Password (OTP).

      User Details:
      - Name: {{{firstName}}} {{{lastName}}}
      - Email: {{{email}}}
      - OTP: {{{otp}}}

      Instructions:
      1. Create a friendly and professional email body that includes the provided OTP.
         - The email should greet the user by their first name.
         - It should clearly state: "Your verification code for Court Commander is: {{{otp}}}".
         - It must include the line: "If you did not request this, please ignore this email."
      2. Set the 'otp' field in your output to be the same as the input OTP: {{{otp}}}.
      3. Set the 'emailBody' field in your output to the email content you just created.
    `,
});


// Define the Genkit flow
const sendOtpFlow = ai.defineFlow(
  {
    name: 'sendOtpFlow',
    inputSchema: SendOtpInputSchema,
    outputSchema: SendOtpOutputSchema,
  },
  async (input) => {
    // Generate the content using the LLM
    const { output } = await sendOtpPrompt(input);

    if (!output) {
      throw new Error('Failed to generate OTP content from the AI model.');
    }

    // In a real application, you would integrate with an email service like SendGrid or AWS SES here.
    // For this example, we will just log the email body to the console to simulate sending.
    console.log('--- SIMULATING OTP EMAIL ---');
    console.log(`To: ${input.email}`);
    console.log(`Subject: Your Court Commander Verification Code`);
    console.log('Body:');
    console.log(output.emailBody);
    console.log('--------------------------');
    
    return output;
  }
);

    