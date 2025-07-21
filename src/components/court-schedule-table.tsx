"use client";

import { useState } from "react";
import type { Booking, Court } from "@/lib/types";
import { TIME_SLOTS } from "@/lib/constants";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookingDialog } from "./booking-dialog";
import { cn } from "@/lib/utils";

interface CourtScheduleTableProps {
  bookings: Booking[];
  courts: Court[];
  onBookSlot: (booking: Omit<Booking, "id" | "status">) => void;
  selectedDate: string;
  onNavigateToTab: (tab: "arrivals" | "payments" | "history" | "schedule") => void;
}

export function CourtScheduleTable({
  bookings,
  courts,
  onBookSlot,
  selectedDate,
  onNavigateToTab
}: CourtScheduleTableProps) {
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<{ courtId: number; timeSlots: string[] }>({ courtId: -1, timeSlots: [] });

  const handleSlotClick = (courtId: number, timeSlot: string) => {
    if (selectedSlots.courtId !== courtId) {
      setSelectedSlots({ courtId, timeSlots: [timeSlot] });
      return;
    }

    const newTimeSlots = [...selectedSlots.timeSlots];
    const slotIndex = newTimeSlots.indexOf(timeSlot);

    if (slotIndex > -1) {
      newTimeSlots.splice(slotIndex);
    } else {
      newTimeSlots.push(timeSlot);
      newTimeSlots.sort((a, b) => TIME_SLOTS.indexOf(a) - TIME_SLOTS.indexOf(b));
    }
    
    setSelectedSlots({ courtId, timeSlots: newTimeSlots });
  };
  
  const handleOpenBookingDialog = () => {
    if (selectedSlots.timeSlots.length > 0) {
      setBookingDialogOpen(true);
    }
  };
  
  const handleCloseBookingDialog = () => {
    setBookingDialogOpen(false);
    setSelectedSlots({ courtId: -1, timeSlots: [] });
  }

  const handleBookingClick = (booking: Booking) => {
    if (booking.status === 'booked') {
      onNavigateToTab('arrivals');
    } else if (booking.status === 'arrived') {
      onNavigateToTab('payments');
    }
  }

  const getBookingForSlot = (courtId: number, timeSlot: string) => {
    return bookings.find((b) => b.courtId === courtId && b.timeSlot.split(" & ")[0] <= timeSlot && timeSlot <= b.timeSlot.split(" & ").slice(-1)[0]);
  };

  const isSlotSelected = (courtId: number, timeSlot: string) => {
    return selectedSlots.courtId === courtId && selectedSlots.timeSlots.includes(timeSlot);
  };

  const getBookingDuration = (timeSlot: string) => {
    return timeSlot.split(" & ").length;
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Time</TableHead>
              {courts.map((court) => (
                <TableHead key={court.id} className="text-center">
                  {court.name}
                  {selectedSlots.courtId === court.id && selectedSlots.timeSlots.length > 0 && (
                     <Button size="sm" className="ml-2" onClick={handleOpenBookingDialog}>Book ({selectedSlots.timeSlots.length})</Button>
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {TIME_SLOTS.map((timeSlot) => (
              <TableRow key={timeSlot}>
                <TableCell className="font-medium">{timeSlot}</TableCell>
                {courts.map((court) => {
                  const booking = getBookingForSlot(court.id, timeSlot);
                  if (booking && booking.timeSlot.split(" & ")[0] !== timeSlot) {
                    return null;
                  }
                  
                  if (booking) {
                    const duration = getBookingDuration(booking.timeSlot);
                    return (
                      <TableCell key={court.id} rowSpan={duration} className="align-top p-1">
                        <div
                          className={cn(
                            "flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-md p-2 text-center min-h-[50px]",
                            booking.status === 'booked' && "bg-accent/20 text-accent-foreground",
                            booking.status === 'arrived' && "bg-primary/20 text-primary-foreground",
                          )}
                          onClick={() => handleBookingClick(booking)}
                        >
                          <p className="font-semibold">{booking.customerName}</p>
                          <Badge variant="secondary" className="mt-1">{booking.status}</Badge>
                        </div>
                      </TableCell>
                    )
                  }
                  
                  return (
                    <TableCell key={court.id} className="p-1">
                      <Button
                        variant={isSlotSelected(court.id, timeSlot) ? "default" : "outline"}
                        size="sm"
                        className="w-full h-full min-h-[50px]"
                        onClick={() => handleSlotClick(court.id, timeSlot)}
                      >
                        {isSlotSelected(court.id, timeSlot) ? 'Selected' : 'Available'}
                      </Button>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {selectedSlots.courtId !== -1 && selectedSlots.timeSlots.length > 0 && (
        <BookingDialog
          isOpen={bookingDialogOpen}
          onClose={handleCloseBookingDialog}
          court={courts.find(c => c.id === selectedSlots.courtId)!}
          timeSlot={selectedSlots.timeSlots.join(" & ")}
          onBook={onBookSlot}
          selectedDate={selectedDate}
        />
      )}
    </>
  );
}
