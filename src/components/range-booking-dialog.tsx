
"use client";

import { useEffect } from "react";
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

  const isUser = user?.role === 'user';

  useEffect(() => {
    if (isOpen && user && isUser) {
      form.setValue('customerName', `${user.firstName} ${user.lastName}`);
      form.setValue('customerPhone', user.phone);
    }
  }, [isOpen, user, form, isUser]);


  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const { courtId, startTime, endTime, customerName, customerPhone } = values;

    if (startTime >= endTime) {
      toast({
        variant: "destructive",
        title: "Invalid Time Range",
        description: "The end time must be after the start time.",
      });
      return;
    }

    const startIndex = timeSlots.findIndex(slot => slot.startsWith(startTime));
    const endIndex = timeSlots.findIndex(slot => slot.endsWith(endTime));
    
    const selectedTimeSlots = timeSlots.slice(startIndex, endIndex + 1);

    // Check for conflicts
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
            description: "One or more selected time slots are already booked for this court.",
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
      description: `${court?.name} from ${startTime} to ${endTime} has been booked for ${customerName}.`,
    });
    form.reset();
    onClose();
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
              <Button type="submit">Confirm Booking</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
