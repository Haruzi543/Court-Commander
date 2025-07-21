
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
  courtId: z.string().min(1, { message: "Please select a court." }),
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
      courtId: "",
      startTime: "",
      endTime: "",
      customerName: "",
      customerPhone: "",
    },
  });

  const { watch, setValue } = form;
  const selectedCourtId = watch('courtId');
  const selectedStartTime = watch('startTime');

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
    }
  }, [isOpen, user, isUser, form]);
  
  const availableEndTimes = useMemo(() => {
    if (!selectedCourtId || !selectedStartTime) {
      return timeSlots;
    }

    const startIndex = timeSlots.indexOf(timeSlots.find(slot => slot.startsWith(selectedStartTime))!);
    if (startIndex === -1) return [];

    const courtBookings = bookings.filter(b => b.courtId === parseInt(selectedCourtId));
    const bookedSlotsForCourt = courtBookings.flatMap(b => b.timeSlot.split(" & "));

    let firstConflictIndex = -1;
    for (let i = startIndex; i < timeSlots.length; i++) {
        if (bookedSlotsForCourt.includes(timeSlots[i])) {
            firstConflictIndex = i;
            break;
        }
    }
    
    const potentialEndSlots = timeSlots.slice(startIndex);
    if (firstConflictIndex !== -1) {
        return potentialEndSlots.slice(0, firstConflictIndex - startIndex);
    }

    return potentialEndSlots;
  }, [selectedCourtId, selectedStartTime, bookings, timeSlots]);
  
  const nextAvailableSlotInfo = useMemo(() => {
    if (!selectedCourtId || !selectedStartTime) return null;

    const startIndex = timeSlots.findIndex(slot => slot.startsWith(selectedStartTime));
    if (startIndex === -1) return null;
    
    const courtBookings = bookings.filter(b => b.courtId === parseInt(selectedCourtId));
    const bookedSlotsForCourt = new Set(courtBookings.flatMap(b => b.timeSlot.split(" & ")));

    if (bookedSlotsForCourt.has(timeSlots[startIndex])) {
        let nextAvailable = null;
        for (let i = startIndex + 1; i < timeSlots.length; i++) {
            if (!bookedSlotsForCourt.has(timeSlots[i])) {
                nextAvailable = timeSlots[i];
                break;
            }
        }
        if (nextAvailable) {
            return `This slot is booked. Next available time is ${nextAvailable.split(' - ')[0]}.`;
        } else {
            return 'This slot is booked. No more available times today for this court.';
        }
    }
    return null;
  }, [selectedCourtId, selectedStartTime, bookings, timeSlots]);


  useEffect(() => {
    setValue('endTime', '');
  }, [selectedCourtId, selectedStartTime, setValue]);


  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const { courtId, startTime, endTime, customerName, customerPhone } = values;
    
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

    // Final conflict check, just in case
    const courtBookings = bookings.filter(b => b.courtId === parseInt(courtId));
    const isConflict = selectedTimeSlots.some(newSlot => 
      courtBookings.some(existingBooking => {
        const existingSlots = existingBooking.timeSlot.split(" & ");
        return existingSlots.includes(newSlot);
      })
    );

    if (isConflict) {
        toast({
            variant: "destructive",
            title: "Booking Conflict",
            description: "One or more selected time slots are no longer available. Please try again.",
        });
        return;
    }

    onBook({
      courtId: parseInt(courtId),
      date: selectedDate,
      timeSlot: selectedTimeSlots.join(" & "),
      customerName,
      customerPhone,
    });

    const court = courts.find(c => c.id === parseInt(courtId));

    toast({
      title: "Booking Confirmed!",
      description: `${court?.name} from ${startTimeValue} to ${endTimeValue} has been booked for ${customerName}.`,
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
            Select a court and a time range to create a booking.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
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
                      {courts.map((court) => (
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
                    <Select onValueChange={field.onChange} value={field.value} disabled={!selectedCourtId || !selectedStartTime}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {availableEndTimes.map((slot) => (
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
             {nextAvailableSlotInfo && (
                <p className="text-sm text-destructive">{nextAvailableSlotInfo}</p>
            )}
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
              <Button type="submit">Confirm Booking</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
