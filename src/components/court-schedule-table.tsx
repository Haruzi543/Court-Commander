
"use client";

import { useState } from "react";
import type { Booking, Court } from "@/lib/types";
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
import { useAuth } from "@/context/auth-context";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Book } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card, CardContent } from "./ui/card";

interface CourtScheduleTableProps {
  bookings: Booking[];
  courts: Court[];
  timeSlots: string[];
  onBookSlot: (booking: Omit<Booking, "id" | "status">) => void;
  selectedDate: string;
  onNavigateToTab: (tab: "arrivals" | "payments" | "history" | "schedule" | "cancellations") => void;
}

export function CourtScheduleTable({
  bookings,
  courts,
  timeSlots,
  onBookSlot,
  selectedDate,
  onNavigateToTab
}: CourtScheduleTableProps) {
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<{ courtId: number; timeSlots: string[] }>({ courtId: -1, timeSlots: [] });
  const [mobileSelectedCourtId, setMobileSelectedCourtId] = useState<string>(String(courts[0]?.id || ''));

  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const handleSlotClick = (courtId: number, timeSlot: string) => {
    // A single click now opens the booking dialog for that slot immediately.
    setSelectedSlots({ courtId, timeSlots: [timeSlot] });
    setBookingDialogOpen(true);
  };
  
  const handleCloseBookingDialog = () => {
    setBookingDialogOpen(false);
    setSelectedSlots({ courtId: -1, timeSlots: [] });
  }

  const handleBookingClick = (booking: Booking) => {
    if (!isAdmin) return;
    if (booking.status === 'booked') {
      onNavigateToTab('arrivals');
    } else if (booking.status === 'arrived') {
      onNavigateToTab('payments');
    } else if (booking.status === 'cancellation_requested') {
      onNavigateToTab('cancellations');
    }
  }

  const getBookingForSlot = (courtId: number, timeSlot: string) => {
    return bookings.find((b) => b.courtId === courtId && b.timeSlot.split(" & ")[0] <= timeSlot && timeSlot <= b.timeSlot.split(" & ").slice(-1)[0]);
  };

  const getBookingDuration = (timeSlot: string) => {
    return timeSlot.split(" & ").length;
  }
  
  const renderSlot = (court: Court, timeSlot: string) => {
    const booking = getBookingForSlot(court.id, timeSlot);
     if (booking && booking.timeSlot.split(" & ")[0] !== timeSlot) {
        return null;
    }

    if (booking) {
        const duration = getBookingDuration(booking.timeSlot);
        return (
            <div
                className={cn(
                    "flex h-full w-full flex-col items-center justify-center rounded-md p-2 text-center min-h-[50px]",
                    booking.status === 'booked' && "bg-accent/20 text-accent-foreground",
                    booking.status === 'arrived' && "bg-primary/20 text-primary-foreground",
                    booking.status === 'cancellation_requested' && "bg-destructive/20 text-destructive-foreground",
                    isAdmin ? "cursor-pointer" : "cursor-not-allowed"
                )}
                style={{ gridRow: `span ${duration}` }}
                onClick={() => handleBookingClick(booking)}
            >
                {isAdmin ? (
                    <>
                        <p className="font-semibold">{booking.customerName}</p>
                        <Badge variant="secondary" className="mt-1">{booking.status.replace('_', ' ')}</Badge>
                    </>
                ) : (
                    <p className="font-semibold text-transparent select-none">Booked</p>
                )}
            </div>
        )
    }

    return (
        <Button
            variant="outline"
            size="sm"
            className="w-full h-full min-h-[50px]"
            onClick={() => handleSlotClick(court.id, timeSlot)}
        >
            Available
        </Button>
    )
  }

  const mobileSelectedCourt = courts.find(c => c.id === Number(mobileSelectedCourtId));

  return (
    <>
      {/* Desktop View: Table */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Time</TableHead>
              {courts.map((court) => (
                <TableHead key={court.id} className="text-center">
                  {court.name}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {timeSlots.map((timeSlot) => (
              <TableRow key={timeSlot}>
                <TableCell className="font-semibold text-base text-foreground">{timeSlot}</TableCell>
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
                            "flex h-full w-full flex-col items-center justify-center rounded-md p-2 text-center min-h-[50px]",
                            booking.status === 'booked' && "bg-accent/20 text-accent-foreground",
                            booking.status === 'arrived' && "bg-primary/20 text-primary-foreground",
                            booking.status === 'cancellation_requested' && "bg-destructive/20 text-destructive-foreground",
                            isAdmin ? "cursor-pointer" : "cursor-not-allowed"
                          )}
                          onClick={() => handleBookingClick(booking)}
                        >
                          {isAdmin ? (
                            <>
                              <p className="font-semibold">{booking.customerName}</p>
                              <Badge variant="secondary" className="mt-1">{booking.status.replace('_', ' ')}</Badge>
                            </>
                          ) : (
                            <p className="font-semibold text-transparent select-none">Booked</p>
                          )}
                        </div>
                      </TableCell>
                    )
                  }
                  
                  return (
                    <TableCell key={court.id} className="p-1">
                      <Button
                        variant={"outline"}
                        size="sm"
                        className="w-full h-full min-h-[50px]"
                        onClick={() => handleSlotClick(court.id, timeSlot)}
                      >
                        Available
                      </Button>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile View: Dropdown */}
      <div className="md:hidden space-y-4">
        <Select value={mobileSelectedCourtId} onValueChange={setMobileSelectedCourtId}>
            <SelectTrigger>
                <SelectValue placeholder="Select a court" />
            </SelectTrigger>
            <SelectContent>
                {courts.map(court => (
                    <SelectItem key={court.id} value={String(court.id)}>
                        <div className="flex items-center gap-3">
                            <Book className="text-primary"/> 
                            {court.name}
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>

        {mobileSelectedCourt && (
            <Card>
                <CardContent className="pt-6">
                    <div className="space-y-2">
                        {timeSlots.map(timeSlot => {
                            const key = `${mobileSelectedCourt.id}-${timeSlot}`;
                            const booking = getBookingForSlot(mobileSelectedCourt.id, timeSlot);
                            
                            if (booking && booking.timeSlot.split(" & ")[0] !== timeSlot) {
                                return null;
                            }
                            
                            if (booking) {
                                return (
                                    <div key={key} className="grid grid-cols-3 items-center gap-2">
                                        <div className="font-semibold text-base text-muted-foreground">{timeSlot}</div>
                                        <div className="col-span-2">
                                        {renderSlot(mobileSelectedCourt, timeSlot)}
                                        </div>
                                    </div>
                                )
                            }

                            return (
                            <div key={key} className="grid grid-cols-3 items-center gap-2">
                                <div className="font-semibold text-base">{timeSlot}</div>
                                <div className="col-span-2">
                                {renderSlot(mobileSelectedCourt, timeSlot)}
                                </div>
                            </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>
        )}
      </div>

      {selectedSlots.courtId !== -1 && selectedSlots.timeSlots.length > 0 && courts.find(c => c.id === selectedSlots.courtId) && (
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

