
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

interface CourtScheduleTableProps {
  bookings: Booking[];
  courts: Court[];
  timeSlots: string[];
  onBookSlot: (booking: Omit<Booking, "id" | "status">) => void;
  selectedDate: string;
  onNavigateToTab: (tab: "arrivals" | "payments" | "history" | "schedule") => void;
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
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const handleSlotClick = (courtId: number, timeSlot: string) => {
    if (selectedSlots.courtId !== courtId && selectedSlots.courtId !== -1) {
      setSelectedSlots({ courtId, timeSlots: [timeSlot] });
      return;
    }
    
    if (selectedSlots.courtId === -1) {
      setSelectedSlots({ courtId, timeSlots: [timeSlot] });
      return;
    }

    let newTimeSlots = [...selectedSlots.timeSlots];
    const slotIndex = newTimeSlots.indexOf(timeSlot);

    if (slotIndex > -1) {
      if (timeSlot === newTimeSlots[newTimeSlots.length - 1]) {
        newTimeSlots.pop();
      } else {
        newTimeSlots.splice(slotIndex);
      }
    } else {
      const lastSlot = newTimeSlots[newTimeSlots.length - 1];
      const lastSlotIndex = timeSlots.indexOf(lastSlot);
      const currentSlotIndex = timeSlots.indexOf(timeSlot);
      if (currentSlotIndex === lastSlotIndex + 1) {
          newTimeSlots.push(timeSlot);
      } else {
          newTimeSlots = [timeSlot];
      }
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
    if (!isAdmin) return;
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
                    isAdmin ? "cursor-pointer" : "cursor-not-allowed"
                )}
                style={{ gridRow: `span ${duration}` }}
                onClick={() => handleBookingClick(booking)}
            >
                {isAdmin ? (
                    <>
                        <p className="font-semibold">{booking.customerName}</p>
                        <Badge variant="secondary" className="mt-1">{booking.status}</Badge>
                    </>
                ) : (
                    <p className="font-semibold text-transparent select-none">Booked</p>
                )}
            </div>
        )
    }

    return (
        <Button
            variant={isSlotSelected(court.id, timeSlot) ? "default" : "outline"}
            size="sm"
            className="w-full h-full min-h-[50px]"
            onClick={() => handleSlotClick(court.id, timeSlot)}
        >
            {isSlotSelected(court.id, timeSlot) ? 'Selected' : 'Available'}
        </Button>
    )
  }

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
                  {selectedSlots.courtId === court.id && selectedSlots.timeSlots.length > 0 && (
                     <Button size="sm" className="ml-2" onClick={handleOpenBookingDialog}>Book ({selectedSlots.timeSlots.length})</Button>
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {timeSlots.map((timeSlot) => (
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
                            "flex h-full w-full flex-col items-center justify-center rounded-md p-2 text-center min-h-[50px]",
                            booking.status === 'booked' && "bg-accent/20 text-accent-foreground",
                            booking.status === 'arrived' && "bg-primary/20 text-primary-foreground",
                            isAdmin ? "cursor-pointer" : "cursor-not-allowed"
                          )}
                          onClick={() => handleBookingClick(booking)}
                        >
                          {isAdmin ? (
                            <>
                              <p className="font-semibold">{booking.customerName}</p>
                              <Badge variant="secondary" className="mt-1">{booking.status}</Badge>
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

      {/* Mobile View: Accordion */}
      <div className="md:hidden">
        <Accordion type="single" collapsible className="w-full" defaultValue={`court-${courts[0]?.id}`}>
            {courts.map(court => (
                <AccordionItem value={`court-${court.id}`} key={court.id}>
                    <AccordionTrigger className="text-lg font-semibold">
                       <div className="flex items-center gap-3">
                         <Book className="text-primary"/> 
                         {court.name}
                       </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        {selectedSlots.courtId === court.id && selectedSlots.timeSlots.length > 0 && (
                            <Button size="sm" className="w-full mb-4" onClick={handleOpenBookingDialog}>
                                Book {selectedSlots.timeSlots.length} selected slot(s)
                            </Button>
                        )}
                        <div className="space-y-2">
                          {timeSlots.map(timeSlot => {
                              const booking = getBookingForSlot(court.id, timeSlot);
                              
                              if (booking && booking.timeSlot.split(" & ")[0] !== timeSlot) {
                                  return null;
                              }
                              
                              if (booking) {
                                  return (
                                      <div key={timeSlot} className="grid grid-cols-3 items-center gap-2">
                                          <div className="text-sm font-medium text-muted-foreground">{timeSlot}</div>
                                          <div className="col-span-2">
                                            {renderSlot(court, timeSlot)}
                                          </div>
                                      </div>
                                  )
                              }

                              return (
                                <div key={timeSlot} className="grid grid-cols-3 items-center gap-2">
                                  <div className="text-sm font-medium">{timeSlot}</div>
                                  <div className="col-span-2">
                                    {renderSlot(court, timeSlot)}
                                  </div>
                                </div>
                              )
                          })}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
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
