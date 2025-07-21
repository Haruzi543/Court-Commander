
'use server';

/**
 * @fileOverview A flow to generate and send an OTP via email.
 *
 * - sendOtp - A function that generates an OTP and sends it using nodemailer.
 * - SendOtpInput - The input type for the sendOtp function.
 * - SendOtpOutput - The return type for the sendOtp function.
 */

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
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const emailBody = `Hello ${input.name},

Thank you for signing up for Court Commander.

Your One-Time Password (OTP) is: ${otp}

Please use this code to complete your registration.

Regards,
The Court Commander Team`;

    const emailHtml = `<p>Hello ${input.name},</p>
<p>Thank you for signing up for Court Commander.</p>
<p>Your One-Time Password (OTP) is: <strong>${otp}</strong></p>
<p>Please use this code to complete your registration.</p>
<p>Regards,<br/>The Court Commander Team</p>`;


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
        html: emailHtml,
    };
    
    const info = await transporter.sendMail(mailOptions);

    return {
      otp: otp,
      messageId: info.messageId,
    };
}
