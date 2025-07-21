"use client";

import type { Booking, Court } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking;
  court: Court;
  rate: number;
  onUpdateBooking: (bookingId: string, status: "booked" | "arrived") => void;
  onDeleteBooking: (bookingId: string) => void;
}

export function PaymentDialog({ isOpen, onClose, booking, court, rate, onUpdateBooking, onDeleteBooking }: PaymentDialogProps) {
  const { toast } = useToast();
  const [currentBooking, setCurrentBooking] = useState(booking);

  useEffect(() => {
    setCurrentBooking(booking);
  }, [booking, isOpen]);
  
  const durationHours = currentBooking.timeSlot.split(" & ").length;
  const totalCost = rate * durationHours;

  const handleMarkArrived = () => {
    onUpdateBooking(currentBooking.id, "arrived");
    setCurrentBooking({ ...currentBooking, status: 'arrived' });
    toast({
      title: "Customer Arrived",
      description: `${currentBooking.customerName} has been marked as arrived.`,
    });
  };

  const handleConfirmPayment = () => {
    onDeleteBooking(currentBooking.id);
    toast({
      title: "Payment Confirmed",
      description: `Booking for ${currentBooking.customerName} has been paid and cleared.`,
    });
    onClose();
  };
  
  const handleCancelBooking = () => {
    onDeleteBooking(currentBooking.id);
    toast({
      title: "Booking Cancelled",
      description: `Booking for ${currentBooking.customerName} has been cancelled.`,
      variant: "destructive",
    });
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Booking Details</DialogTitle>
          <DialogDescription>
            {court.name} - {currentBooking.timeSlot}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Customer:</span>
            <span className="font-medium">{currentBooking.customerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Phone:</span>
            <span className="font-medium">{currentBooking.customerPhone}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status:</span>
            <span className="font-medium capitalize">{currentBooking.status}</span>
          </div>
           <div className="flex justify-between">
            <span className="text-muted-foreground">Duration:</span>
            <span className="font-medium">{durationHours} hour(s)</span>
          </div>
          {currentBooking.status === "arrived" && (
            <>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Hourly Rate:</span>
                <span className="font-medium">${rate.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-lg">
                <span className="font-semibold">Total Cost:</span>
                <span className="font-bold text-primary">${totalCost.toFixed(2)}</span>
              </div>
            </>
          )}
        </div>
        <DialogFooter className="sm:justify-between gap-2">
            <Button variant="destructive" onClick={handleCancelBooking}>Cancel Booking</Button>
            {currentBooking.status === "booked" ? (
              <Button onClick={handleMarkArrived}>Mark as Arrived</Button>
            ) : (
              <Button onClick={handleConfirmPayment}>Confirm Payment</Button>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
