
"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import type { Booking, CourtRate } from "@/lib/types";
import { 
  addBooking as addBookingAction,
  updateBookingStatus as updateBookingStatusAction,
  deleteBooking as deleteBookingAction,
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

  const updateBookingStatus = useCallback((bookingId: string, status: "booked" | "arrived") => {
    startTransition(async () => {
      const updatedBooking = await updateBookingStatusAction(bookingId, status);
      setBookings((prev) =>
        prev.map((b) => (b.id === updatedBooking.id ? updatedBooking : b))
      );
    });
  }, []);

  const deleteBooking = useCallback((bookingId: string) => {
    startTransition(async () => {
      await deleteBookingAction(bookingId);
      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
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
    deleteBooking,
    updateCourtRates,
  };
}
