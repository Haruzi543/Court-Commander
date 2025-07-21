# Court Commander

Court Commander is a Next.js application for managing badminton court bookings. It allows a manager to view court schedules, book slots for customers, confirm arrivals, and process payments. All data is stored locally in the browser.

## Core Features

- **Court Schedule Display**: A real-time grid showing available, booked, and arrived statuses for all courts and time slots.
- **Booking Management**: Click an available slot to open a booking modal and enter customer details.
- **Arrival Confirmation**: A dedicated tab to search for upcoming bookings and mark customers as arrived.
- **Payment Calculation**: Set custom hourly rates for each court, calculate the total cost for a booking, and confirm payment to clear the slot.
- **Local Data Storage**: All booking and rate data is stored in the browser's `localStorage`, making it simple and serverless.

## Getting Started

To get started, run the development server:

```bash
npm run dev
```

Open [http://localhost:9002](http://localhost:9002) with your browser to see the result.
