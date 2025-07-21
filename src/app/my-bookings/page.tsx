
"use client";

import { ProtectedRoute } from "@/components/protected-route";
import { MyBookings } from "@/components/my-bookings";

export default function MyBookingsPage() {
  return (
    <ProtectedRoute>
      <MyBookings />
    </ProtectedRoute>
  );
}
