
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
      // Reset to default state when dialog opens
      setAutoFindCourt(true);
    }
  }, [isOpen, user, isUser, form]);
  
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const { courtId, startTime, endTime, customerName, customerPhone } = values;
    
    if (!autoFindCourt && !courtId) {
        form.setError("courtId", { type: "manual", message: "Please select a court." });
        return;
    }
    
    const startIndex = timeSlots.findIndex(slot => slot.startsWith(startTime));
    const endIndex = timeSlots.findIndex(slot => slot.endsWith(endTime));
    
    if (startIndex === -1 || endIndex === -1 || startIndex > endIndex) {
        toast({
            variant: "destructive",
            title: "Invalid Time Range",
            description: "Please ensure the start and end times are valid and in chronological order.",
        });
        return;
    }

    const selectedTimeSlots = timeSlots.slice(startIndex, endIndex + 1);

    const checkCourtAvailability = (court: Court) => {
        return !bookings.some(booking => {
            if (booking.courtId !== court.id) return false;
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
      userEmail: user.email,
    });

    toast({
      title: "Booking Confirmed!",
      description: `${targetCourt.name} from ${startTime} to ${endTime} has been booked for ${customerName}.`,
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
            Select a time range. You can either pick a specific court or have the system find one for you.
          </DialogDescription>
        </DialogHeader>
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
              <Button type="submit">Book Time</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
