
"use client";

import { useEffect, useMemo } from "react";
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
  startTime: z.string().min(1, { message: "Please select a start time." }),
  endTime: z.string().min(1, { message: "Please select an end time." }),
  customerName: z.string().min(2, { message: "Name must be at least 2 characters." }),
  customerPhone: z.string().min(1, { message: "Phone number is required." }),
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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
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
        startTime: "",
        endTime: "",
        customerName: isUser ? `${user.firstName} ${user.lastName}` : "",
        customerPhone: isUser ? user.phone : "",
      });
    }
  }, [isOpen, user, isUser, form]);
  
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const { startTime, endTime, customerName, customerPhone } = values;
    
    const startTimeValue = timeSlots.find(slot => slot.startsWith(startTime))?.split(' - ')[0];
    const endTimeValue = timeSlots.find(slot => slot.endsWith(endTime))?.split(' - ')[1];
    
    if (!startTimeValue || !endTimeValue || startTimeValue >= endTimeValue) {
      toast({
        variant: "destructive",
        title: "Invalid Time Range",
        description: "The end time must be after the start time.",
      });
      return;
    }

    const startIndex = timeSlots.findIndex(slot => slot.startsWith(startTimeValue));
    const endIndex = timeSlots.findIndex(slot => slot.endsWith(endTimeValue));
    const selectedTimeSlots = timeSlots.slice(startIndex, endIndex + 1);

    // Find the first available court for the entire time range
    const availableCourt = courts.find(court => {
        // Check if this court has any conflicting bookings
        const hasConflict = bookings.some(booking => {
            if (booking.courtId !== court.id) {
                return false; // Not this court
            }
            const existingSlots = booking.timeSlot.split(" & ");
            // Return true if any of the selected slots are already in this booking
            return selectedTimeSlots.some(slot => existingSlots.includes(slot));
        });
        // If there's no conflict, this court is available
        return !hasConflict;
    });

    if (!availableCourt) {
        toast({
            variant: "destructive",
            title: "No Available Courts",
            description: "No courts are available for the entire selected time range. Please try a different time.",
        });
        return;
    }

    onBook({
      courtId: availableCourt.id,
      date: selectedDate,
      timeSlot: selectedTimeSlots.join(" & "),
      customerName,
      customerPhone,
    });

    toast({
      title: "Booking Confirmed!",
      description: `${availableCourt.name} from ${startTimeValue} to ${endTimeValue} has been booked for ${customerName}.`,
    });
    handleClose();
  };
  
  const handleClose = () => {
    form.reset();
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Book by Time Range</DialogTitle>
          <DialogDescription>
            Select a time range. The system will find an available court for you.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
              <Button type="submit">Find Court & Book</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
