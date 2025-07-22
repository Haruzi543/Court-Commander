
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { Court, Booking } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface RangeBookingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  courts: Court[];
  timeSlots: string[];
  bookings: Booking[];
  selectedDate: string;
  onBook: (booking: Omit<Booking, "id" | "status">) => void;
}

const formSchema = z.object({
  courtId: z.string().optional(),
  startTime: z.string().min(1, { message: "Please select a start time." }),
  endTime: z.string().min(1, { message: "Please select an end time." }),
  customerName: z.string().min(2, { message: "Name must be at least 2 characters." }),
  customerPhone: z.string().min(1, { message: "Phone number is required." }),
}).refine(data => {
  if (!data.startTime || !data.endTime) return true; // Let individual field validation handle this
  const startTimeValue = data.startTime.split(':')[0];
  const endTimeValue = data.endTime.split(':')[0];
  return parseInt(endTimeValue) > parseInt(startTimeValue);
}, {
  message: "End time must be after the start time.",
  path: ["endTime"],
});

export function RangeBookingDialog({ 
    isOpen, 
    onClose, 
    courts, 
    timeSlots,
    bookings, 
    selectedDate, 
    onBook 
}: RangeBookingDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [autoFindCourt, setAutoFindCourt] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [bookingDetails, setBookingDetails] = useState<z.infer<typeof formSchema> | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      courtId: "",
      startTime: "",
      endTime: "",
      customerName: "",
      customerPhone: "",
    },
  });

  const isUser = user?.role === 'user';

  useEffect(() => {
    if (isOpen) {
      form.reset({
        courtId: "",
        startTime: "",
        endTime: "",
        customerName: isUser ? `${user.firstName} ${user.lastName}` : "",
        customerPhone: isUser ? user.phone : "",
      });
      setAutoFindCourt(true);
      setShowConfirm(false);
      setCountdown(60);
      setBookingDetails(null);
    }
  }, [isOpen, user, isUser, form]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showConfirm && countdown > 0 && isUser) {
        timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (showConfirm && countdown === 0 && isUser) {
        handleClose();
        toast({
            variant: "destructive",
            title: "Booking timed out",
            description: "You did not confirm the booking in time.",
        });
    }
    return () => clearTimeout(timer);
  }, [showConfirm, countdown, isUser, toast, handleClose]);

  const handleConfirmBooking = () => {
    if (!bookingDetails) return;

    const { courtId, startTime, endTime, customerName, customerPhone } = bookingDetails;
    
    if (!autoFindCourt && !courtId) {
        form.setError("courtId", { type: "manual", message: "Please select a court." });
        return;
    }
    
    const startIndex = timeSlots.findIndex(slot => slot.startsWith(startTime));
    const endIndex = timeSlots.findIndex(slot => slot.endsWith(endTime));
    
    const selectedTimeSlots = timeSlots.slice(startIndex, endIndex + 1);

    const checkCourtAvailability = (court: Court) => {
        return !bookings.some(booking => {
            if (booking.courtId !== court.id || booking.status === 'cancelled' || booking.status === 'completed') return false;
            const existingSlots = booking.timeSlot.split(" & ");
            return selectedTimeSlots.some(slot => existingSlots.includes(slot));
        });
    };

    let targetCourt: Court | undefined;
    
    if (autoFindCourt) {
        targetCourt = courts.find(checkCourtAvailability);
    } else {
        const selectedCourt = courts.find(c => c.id === Number(courtId));
        if (selectedCourt && checkCourtAvailability(selectedCourt)) {
            targetCourt = selectedCourt;
        }
    }
    
    if (!targetCourt) {
        toast({
            variant: "destructive",
            title: "No Available Courts",
            description: autoFindCourt
              ? "No courts are available for the entire selected time range. Please try a different time."
              : "The selected court is not available for this time range. Please try another court or time.",
        });
        setShowConfirm(false); // Go back to the form
        return;
    }

    if (!user?.email) {
      toast({ variant: "destructive", title: "Authentication Error", description: "Could not identify user." });
      return;
    }

    onBook({
      courtId: targetCourt.id,
      date: selectedDate,
      timeSlot: selectedTimeSlots.join(" & "),
      customerName,
      customerPhone,
    });

    toast({
      title: "Booking Confirmed!",
      description: `${targetCourt.name} from ${startTime} to ${endTime} has been booked for ${customerName}.`,
    });
    handleClose();
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (isUser) {
        setBookingDetails(values);
        setShowConfirm(true);
        setCountdown(60);
    } else {
        setBookingDetails(values); // Set details so confirm can use it
        // We need to use a timeout to allow state to update before calling confirm
        setTimeout(() => handleConfirmBooking(), 0);
    }
  };
  
  const handleClose = () => {
    form.reset();
    setShowConfirm(false);
    setCountdown(60);
    setBookingDetails(null);
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Book by Time Range</DialogTitle>
          <DialogDescription>
            {showConfirm 
                ? `Please confirm your booking for ${bookingDetails?.startTime} - ${bookingDetails?.endTime}.`
                : "Select a time range. You can either pick a specific court or have the system find one for you."
            }
          </DialogDescription>
        </DialogHeader>
        {!showConfirm ? (
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <div className="flex items-center space-x-2">
                    <Switch 
                        id="auto-find-court" 
                        checked={autoFindCourt} 
                        onCheckedChange={setAutoFindCourt}
                    />
                    <Label htmlFor="auto-find-court">Find an available court automatically</Label>
                </div>
                {!autoFindCourt && (
                    <FormField
                        control={form.control}
                        name="courtId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Court</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a court" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {courts.map(court => (
                                            <SelectItem key={court.id} value={String(court.id)}>
                                                {court.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {timeSlots.map((slot) => (
                                <SelectItem key={`start-${slot}`} value={slot.split(' - ')[0]}>
                                {slot.split(' - ')[0]}
                                </SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>End Time</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {timeSlots.map((slot) => (
                                <SelectItem key={`end-${slot}`} value={slot.split(' - ')[1]}>
                                {slot.split(' - ')[1]}
                                </SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Customer Name</FormLabel>
                    <FormControl>
                        <Input placeholder="John Doe" {...field} disabled={isUser} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="customerPhone"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                        <Input placeholder="555-555-5555" {...field} disabled={isUser} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <DialogFooter>
                <Button type="submit">
                    {isUser ? 'Request Booking' : 'Book Time'}
                </Button>
                </DialogFooter>
            </form>
            </Form>
        ) : (
            <div className="pt-4">
                <DialogFooter>
                    <div className="flex w-full gap-2">
                        <Button type="button" variant="outline" className="w-full" onClick={() => setShowConfirm(false)}>
                            Cancel
                        </Button>
                        <Button type="button" className="w-full" onClick={handleConfirmBooking}>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Confirm ({countdown}s)
                        </Button>
                    </div>
                </DialogFooter>
            </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

