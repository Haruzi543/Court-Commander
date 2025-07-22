
"use client";

import { useState, useEffect } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";

interface BookingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  court: Court;
  timeSlot: string;
  selectedDate: string;
  onBook: (booking: Omit<Booking, "id" | "status">) => void;
}

const formSchema = z.object({
  customerName: z.string().min(2, { message: "Name must be at least 2 characters." }),
  customerPhone: z.string().min(1, { message: "Phone number is required" }),
});

export function BookingDialog({ isOpen, onClose, court, timeSlot, selectedDate, onBook }: BookingDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [countdown, setCountdown] = useState(60);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
    },
  });
  
  const isUser = user?.role === 'user';

  useEffect(() => {
    if (isOpen && user) {
      form.setValue('customerName', isUser ? `${user.firstName} ${user.lastName}` : '');
      form.setValue('customerPhone', isUser ? user.phone : '');
    }
  }, [isOpen, user, form, isUser]);

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
  }, [showConfirm, countdown, isUser]);

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    if (isUser && !showConfirm) {
      form.trigger().then(isValid => {
        if (isValid) {
          setShowConfirm(true);
          setCountdown(60);
        }
      });
    } else {
      if (!user?.email) {
        toast({ variant: "destructive", title: "Authentication Error", description: "Could not identify user."});
        return;
      }
      onBook({
        courtId: court.id,
        date: selectedDate,
        timeSlot,
        ...values,
      });
      toast({
        title: "Booking Confirmed!",
        description: `${court.name} at ${timeSlot} has been booked for ${values.customerName}.`,
      });
      handleClose();
    }
  };
  
  const handleClose = () => {
    form.reset();
    setShowConfirm(false);
    setCountdown(60);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Book Court</DialogTitle>
          <DialogDescription>
            Booking {court.name} for {timeSlot}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} disabled={showConfirm || isUser} />
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
                    <Input placeholder="555-555-5555" {...field} disabled={showConfirm || isUser} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              {isUser && showConfirm ? (
                <div className="flex w-full gap-2">
                  <Button type="button" variant="outline" className="w-full" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button type="submit" className="w-full">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Confirm ({countdown}s)
                  </Button>
                </div>
              ) : (
                <Button type="submit">
                  {isUser ? 'Request Booking ' : 'Book'}
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
