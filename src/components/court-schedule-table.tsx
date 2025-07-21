"use client";

import { useState } from "react";
import type { Booking, Court, CourtRate } from "@/lib/types";
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
import { PaymentDialog } from "./payment-dialog";
import { cn } from "@/lib/utils";

interface CourtScheduleTableProps {
  bookings: Booking[];
  courts: Court[];
  courtRates: CourtRate;
  onBookSlot: (booking: Omit<Booking, "id" | "status">) => void;
  onUpdateBooking: (bookingId: string, status: "booked" | "arrived") => void;
  onDeleteBooking: (bookingId: string) => void;
}

export function CourtScheduleTable({
  bookings,
  courts,
  courtRates,
  onBookSlot,
  onUpdateBooking,
  onDeleteBooking,
}: CourtScheduleTableProps) {
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ courtId: number; timeSlot: string } | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const handleOpenBookingDialog = (courtId: number, timeSlot: string) => {
    setSelectedSlot({ courtId, timeSlot });
    setBookingDialogOpen(true);
  };

  const handleOpenPaymentDialog = (booking: Booking) => {
    setSelectedBooking(booking);
    setPaymentDialogOpen(true);
  };

  const getBookingForSlot = (courtId: number, timeSlot: string) => {
    return bookings.find((b) => b.courtId === courtId && b.timeSlot === timeSlot);
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Time</TableHead>
              {courts.map((court) => (
                <TableHead key={court.id}>{court.name}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {TIME_SLOTS.map((timeSlot) => (
              <TableRow key={timeSlot}>
                <TableCell className="font-medium">{timeSlot}</TableCell>
                {courts.map((court) => {
                  const booking = getBookingForSlot(court.id, timeSlot);
                  return (
                    <TableCell key={court.id}>
                      {booking ? (
                        <div
                          className={cn(
                            "flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-md p-2 text-center",
                            booking.status === 'booked' && "bg-accent/20 text-accent-foreground",
                            booking.status === 'arrived' && "bg-primary/20 text-primary-foreground",
                          )}
                          onClick={() => handleOpenPaymentDialog(booking)}
                        >
                          <p className="font-semibold">{booking.customerName}</p>
                          <Badge variant="secondary" className="mt-1">{booking.status}</Badge>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => handleOpenBookingDialog(court.id, timeSlot)}
                        >
                          Book
                        </Button>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {selectedSlot && (
        <BookingDialog
          isOpen={bookingDialogOpen}
          onClose={() => setBookingDialogOpen(false)}
          court={courts.find(c => c.id === selectedSlot.courtId)!}
          timeSlot={selectedSlot.timeSlot}
          onBook={onBookSlot}
        />
      )}
      {selectedBooking && (
        <PaymentDialog
          isOpen={paymentDialogOpen}
          onClose={() => setPaymentDialogOpen(false)}
          booking={selectedBooking}
          court={courts.find(c => c.id === selectedBooking.courtId)!}
          rate={courtRates[selectedBooking.courtId]}
          onUpdateBooking={onUpdateBooking}
          onDeleteBooking={onDeleteBooking}
        />
      )}
    </>
  );
}
