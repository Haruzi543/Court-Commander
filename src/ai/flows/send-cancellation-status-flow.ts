
'use server';

/**
 * @fileOverview A flow to send an email about the status of a cancellation request.
 *
 * - sendCancellationStatusEmail - A function that sends an email using nodemailer.
 * - SendCancellationStatusEmailInput - The input type for the function.
 * - SendCancellationStatusEmailOutput - The return type for the function.
 */

import { z } from 'zod';
import nodemailer from 'nodemailer';
import type { Booking, Court } from '@/lib/types';
import { getUserByEmail } from '@/lib/data-service';

const SendCancellationStatusEmailInputSchema = z.object({
  booking: z.any(), // Zod doesn't have a clean way to handle the Booking type from another file
  court: z.any(), // Same for Court type
  status: z.enum(['approved', 'rejected']),
});
export type SendCancellationStatusEmailInput = z.infer<typeof SendCancellationStatusEmailInputSchema>;

const SendCancellationStatusEmailOutputSchema = z.object({
  messageId: z.string().describe('The message ID from the email service.'),
});
export type SendCancellationStatusEmailOutput = z.infer<typeof SendCancellationStatusEmailOutputSchema>;

export async function sendCancellationStatusEmail(input: SendCancellationStatusEmailInput): Promise<SendCancellationStatusEmailOutput> {
    const { booking, court, status } = input;
    const user = await getUserByEmail(booking.userEmail);

    if (!user) {
        throw new Error('User not found for this booking.');
    }

    const subject = status === 'approved' 
        ? 'Your Cancellation Request has been Approved' 
        : 'Update on your Cancellation Request';

    const emailBody = `Hello ${user.firstName},

This is an update regarding your booking cancellation request.

Booking Details:
- Court: ${court.name}
- Date: ${booking.date}
- Time: ${booking.timeSlot}

Your cancellation request has been ${status}.

${status === 'approved' 
    ? 'The booking has been cancelled and the slot is now available for others.' 
    : 'Your booking remains active. Please contact us if you have any questions.'
}

Regards,
The Court Commander Team`;

    const emailHtml = `<p>Hello ${user.firstName},</p>
<p>This is an update regarding your booking cancellation request.</p>
<p><b>Booking Details:</b></p>
<ul>
    <li><b>Court:</b> ${court.name}</li>
    <li><b>Date:</b> ${booking.date}</li>
    <li><b>Time:</b> ${booking.timeSlot}</li>
</ul>
<p>Your cancellation request has been <strong>${status}</strong>.</p>
<p>${status === 'approved' 
    ? 'The booking has been cancelled and the slot is now available for others.' 
    : 'Your booking remains active. Please contact us if you have any questions.'
}</p>
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
        to: user.email,
        subject: subject,
        text: emailBody,
        html: emailHtml,
    };
    
    try {
        const info = await transporter.sendMail(mailOptions);
        return {
          messageId: info.messageId,
        };
    } catch (error) {
        console.error("Email sending failed:", error);
        throw new Error("Could not send email. Please check your configuration.");
    }
}
