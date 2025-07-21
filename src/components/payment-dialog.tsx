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

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking;
  court: Court;
  rate: number;
  onCompleteBooking: (bookingId: string) => void;
}

export function PaymentDialog({ isOpen, onClose, booking, court, rate, onCompleteBooking }: PaymentDialogProps) {
  const { toast } = useToast();
  
  const durationHours = booking.timeSlot.split(" & ").length;
  const totalCost = rate * durationHours;

  const handleConfirmPayment = () => {
    onCompleteBooking(booking.id);
    toast({
      title: "Payment Confirmed",
      description: `Booking for ${booking.customerName} has been paid and cleared.`,
    });
    onClose();
  };
  
  const handleCancelBooking = () => {
    onCompleteBooking(booking.id);
    toast({
      title: "Booking Cancelled",
      description: `Booking for ${booking.customerName} has been cancelled and moved to history.`,
      variant: "destructive",
    });
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Process Payment</DialogTitle>
          <DialogDescription>
            {court.name} - {booking.timeSlot}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Customer:</span>
            <span className="font-medium">{booking.customerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Phone:</span>
            <span className="font-medium">{booking.customerPhone}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-muted-foreground">Duration:</span>
            <span className="font-medium">{durationHours} hour(s)</span>
          </div>
           <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Hourly Rate:</span>
            <span className="font-medium">₭{rate.toFixed(0)}</span>
          </div>
          <div className="flex justify-between items-center text-lg">
            <span className="font-semibold">Total Cost:</span>
            <span className="font-bold text-primary">₭{totalCost.toFixed(0)}</span>
          </div>
        </div>
        <DialogFooter className="sm:justify-between gap-2">
            <Button variant="destructive" onClick={handleCancelBooking}>Cancel Booking</Button>
            <Button onClick={handleConfirmPayment}>Confirm Payment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
