
'use server';

/**
 * @fileOverview An AI flow to generate and send an OTP via email.
 *
 * - sendOtp - A function that generates an OTP and sends it using nodemailer.
 * - SendOtpInput - The input type for the sendOtp function.
 * - SendOtpOutput - The return type for the sendOtp function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import nodemailer from 'nodemailer';

const SendOtpInputSchema = z.object({
  email: z.string().email().describe('The email address to send the OTP to.'),
  name: z.string().describe('The name of the user.'),
});
export type SendOtpInput = z.infer<typeof SendOtpInputSchema>;

const SendOtpOutputSchema = z.object({
  otp: z.string().describe('The 6-digit OTP that was sent.'),
  messageId: z.string().describe('The message ID from the email service.'),
});
export type SendOtpOutput = z.infer<typeof SendOtpOutputSchema>;

export async function sendOtp(input: SendOtpInput): Promise<SendOtpOutput> {
  return sendOtpFlow(input);
}

const otpPrompt = ai.definePrompt({
    name: 'otpPrompt',
    input: {
        schema: z.object({ name: z.string(), otp: z.string() }),
    },
    prompt: `You are a helpful assistant for a badminton court booking app called Court Commander.
    
    A user named {{name}} has requested to sign up. 
    
    Write a brief, friendly, and professional email body containing their One-Time Password (OTP).
    
    The OTP is: {{otp}}
    
    Keep the email concise and clear. Mention that the OTP is for their Court Commander account registration.`,
});


const sendOtpFlow = ai.defineFlow(
  {
    name: 'sendOtpFlow',
    inputSchema: SendOtpInputSchema,
    outputSchema: SendOtpOutputSchema,
  },
  async (input) => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const { text: emailBody } = await otpPrompt({
        input: {
            name: input.name,
            otp: otp
        }
    });

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASS,
        },
    });

    const mailOptions = {
        from: `"Court Commander" <${process.env.GMAIL_USER}>`,
        to: input.email,
        subject: 'Your Court Commander OTP Code',
        text: emailBody,
        html: `<p>${emailBody.replace(/\n/g, '<br>')}</p>`,
    };
    
    const info = await transporter.sendMail(mailOptions);

    return {
      otp: otp,
      messageId: info.messageId,
    };
  }
);
