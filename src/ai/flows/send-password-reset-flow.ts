
'use server';

/**
 * @fileOverview A flow to generate and send a password reset OTP via email.
 *
 * - sendPasswordResetOtp - A function that generates an OTP and sends it using nodemailer.
 * - SendPasswordResetOtpInput - The input type for the function.
 * - SendPasswordResetOtpOutput - The return type for the function.
 */

import { z } from 'zod';
import nodemailer from 'nodemailer';

const SendPasswordResetOtpInputSchema = z.object({
  email: z.string().email().describe('The email address to send the OTP to.'),
  name: z.string().describe('The name of the user.'),
});
export type SendPasswordResetOtpInput = z.infer<typeof SendPasswordResetOtpInputSchema>;

const SendPasswordResetOtpOutputSchema = z.object({
  otp: z.string().describe('The 6-digit OTP that was sent.'),
  messageId: z.string().describe('The message ID from the email service.'),
});
export type SendPasswordResetOtpOutput = z.infer<typeof SendPasswordResetOtpOutputSchema>;

export async function sendPasswordResetOtp(input: SendPasswordResetOtpInput): Promise<SendPasswordResetOtpOutput> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const emailBody = `Hello ${input.name},

You requested to reset your password for Court Commander.

Your One-Time Password (OTP) for password reset is: ${otp}

Please use this code to reset your password. If you did not request this, please ignore this email.

Regards,
The Court Commander Team`;

    const emailHtml = `<p>Hello ${input.name},</p>
<p>You requested to reset your password for Court Commander.</p>
<p>Your One-Time Password (OTP) for password reset is: <strong>${otp}</strong></p>
<p>Please use this code to reset your password. If you did not request this, please ignore this email.</p>
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
        subject: 'Your Court Commander Password Reset Code',
        text: emailBody,
        html: emailHtml,
    };
    
    const info = await transporter.sendMail(mailOptions);

    return {
      otp: otp,
      messageId: info.messageId,
    };
}
