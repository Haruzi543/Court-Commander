"use client";

import { useState, useEffect, useCallback } from "react";
import type { Booking, CourtRate } from "@/lib/types";
import { COURTS, DEFAULT_HOURLY_RATE } from "@/lib/constants";

const BOOKINGS_STORAGE_KEY = "courtCommanderBookings";
const RATES_STORAGE_KEY = "courtCommanderRates";

export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [courtRates, setCourtRates] = useState<CourtRate>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedBookings = localStorage.getItem(BOOKINGS_STORAGE_KEY);
      if (storedBookings) {
        setBookings(JSON.parse(storedBookings));
      }

      const storedRates = localStorage.getItem(RATES_STORAGE_KEY);
      if (storedRates) {
        setCourtRates(JSON.parse(storedRates));
      } else {
        const defaultRates = COURTS.reduce((acc, court) => {
          acc[court.id] = DEFAULT_HOURLY_RATE;
          return acc;
        }, {} as CourtRate);
        setCourtRates(defaultRates);
      }
    } catch (error) {
      console.error("Failed to read from localStorage", error);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(bookings));
      } catch (error) {
        console.error("Failed to write bookings to localStorage", error);
      }
    }
  }, [bookings, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(RATES_STORAGE_KEY, JSON.stringify(courtRates));
      } catch (error) {
        console.error("Failed to write rates to localStorage", error);
      }
    }
  }, [courtRates, isLoaded]);

  const addBooking = useCallback((booking: Omit<Booking, "id" | "status">) => {
    setBookings((prev) => [
      ...prev,
      { ...booking, id: new Date().toISOString(), status: "booked" },
    ]);
  }, []);

  const updateBookingStatus = useCallback((bookingId: string, status: "booked" | "arrived") => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status } : b))
    );
  }, []);

  const deleteBooking = useCallback((bookingId: string) => {
    setBookings((prev) => prev.filter((b) => b.id !== bookingId));
  }, []);
  
  const updateCourtRates = useCallback((rates: CourtRate) => {
    setCourtRates(rates);
  }, []);

  return {
    bookings,
    courtRates,
    isLoaded,
    addBooking,
    updateBookingStatus,
    deleteBooking,
    updateCourtRates,
  };
}
