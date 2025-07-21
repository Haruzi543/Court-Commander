"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import type { Booking, Court, CourtRate } from "@/lib/types";
import { 
  addBooking as addBookingAction,
  updateBookingStatus as updateBookingStatusAction,
  completeBooking as completeBookingAction,
  updateCourtSettings as updateCourtSettingsAction,
  getData
} from "@/lib/data-service";
import { useToast } from "./use-toast";

export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [courtRates, setCourtRates] = useState<CourtRate>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    const { bookings, courts, timeSlots, courtRates } = await getData();
    setBookings(bookings);
    setCourts(courts);
    setTimeSlots(timeSlots);
    setCourtRates(courtRates);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addBooking = useCallback((booking: Omit<Booking, "id" | "status">) => {
    startTransition(async () => {
      try {
        const newBooking = await addBookingAction(booking);
        setBookings((prev) => [...prev, newBooking]);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Booking Failed",
          description: (error as Error).message,
        });
        // Re-sync client state with server state on failure
        await loadData();
      }
    });
  }, [toast, loadData]);

  const updateBookingStatus = useCallback((bookingId: string, status: "booked" | "arrived") => {
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
  
  const updateCourtSettings = useCallback((settings: {courts: Court[], timeSlots: string[], rates: CourtRate}) => {
    startTransition(async () => {
      const updatedSettings = await updateCourtSettingsAction(settings);
      setCourts(updatedSettings.courts);
      setTimeSlots(updatedSettings.timeSlots);
      setCourtRates(updatedSettings.courtRates);
    });
  }, []);

  return {
    bookings,
    courts,
    timeSlots,
    courtRates,
    isLoaded: isLoaded && !isPending,
    addBooking,
    updateBookingStatus,
    completeBooking,
    updateCourtSettings,
  };
}
