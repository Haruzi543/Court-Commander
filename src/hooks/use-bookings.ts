
"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import type { Booking, CourtRate } from "@/lib/types";
import { 
  addBooking as addBookingAction,
  updateBookingStatus as updateBookingStatusAction,
  completeBooking as completeBookingAction,
  updateCourtRates as updateCourtRatesAction,
  getData
} from "@/lib/data-service";

export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [courtRates, setCourtRates] = useState<CourtRate>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();

  const loadData = useCallback(async () => {
    const { bookings, courtRates } = await getData();
    setBookings(bookings);
    setCourtRates(courtRates);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addBooking = useCallback((booking: Omit<Booking, "id" | "status">) => {
    startTransition(async () => {
      const newBooking = await addBookingAction(booking);
      setBookings((prev) => [...prev, newBooking]);
    });
  }, []);

  const updateBookingStatus = useCallback((bookingId: string, status: "booked" | "arrived" | "completed") => {
    startTransition(async () => {
      const updatedBooking = await updateBookingStatusAction(bookingId, status);
      setBookings((prev) =>
        prev.map((b) => (b.id === updatedBooking.id ? updatedBooking : b))
      );
    });
  }, []);

  const completeBooking = useCallback((bookingId: string) => {
    startTransition(async () => {
      const updatedBooking = await completeBookingAction(bookingId);
      setBookings((prev) =>
        prev.map((b) => (b.id === updatedBooking.id ? updatedBooking : b))
      );
    });
  }, []);
  
  const updateCourtRates = useCallback((rates: CourtRate) => {
    startTransition(async () => {
      const updatedRates = await updateCourtRatesAction(rates);
      setCourtRates(updatedRates);
    });
  }, []);

  return {
    bookings,
    courtRates,
    isLoaded: isLoaded && !isPending,
    addBooking,
    updateBookingStatus,
    completeBooking,
    updateCourtRates,
  };
}
