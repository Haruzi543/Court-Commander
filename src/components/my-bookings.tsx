
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { useAuth } from "@/context/auth-context";
import { useBookings } from "@/hooks/use-bookings";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Ticket } from "lucide-react";
import type { Booking } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export function MyBookings() {
  const { user } = useAuth();
  const { bookings, courts, isLoaded, updateBookingStatus } = useBookings();
  const [cancellationRequest, setCancellationRequest] = useState<Booking | null>(null);
  const { toast } = useToast();

  const myBookings = useMemo(() => {
    if (!user) return [];
    const fullName = `${user.firstName} ${user.lastName}`;
    return bookings
      .filter((b) => b.customerName === fullName && b.customerPhone === user.phone)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.timeSlot.localeCompare(a.timeSlot));
  }, [bookings, user]);

  const getCourtName = (courtId: number) => {
    const court = courts.find((c) => c.id === courtId);
    return court ? court.name : "Unknown Court";
  };
  
  const handleRequestCancellation = () => {
    if (!cancellationRequest) return;
    updateBookingStatus(cancellationRequest.id, 'cancellation_requested');
    toast({
        title: "Cancellation Requested",
        description: "Your request has been sent to the admin for approval."
    });
    setCancellationRequest(null);
  }

  if (!isLoaded || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  const getStatusVariant = (status: Booking['status']) => {
    switch (status) {
        case 'completed':
            return 'secondary';
        case 'arrived':
            return 'default';
        case 'cancellation_requested':
            return 'destructive';
        case 'cancelled':
            return 'outline';
        default:
            return 'outline';
    }
  }

  return (
    <>
    <div className="flex min-h-screen flex-col bg-background">
       <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back to Schedule</span>
                    </Link>
                </Button>
                <h1 className="text-xl font-bold tracking-tight">My Bookings</h1>
            </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Hello, {user.firstName}!</CardTitle>
            <CardDescription>
              Here is a list of all your bookings. You can request to cancel an upcoming booking.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-2 py-3 text-xs md:text-sm">Date</TableHead>
                    <TableHead className="px-2 py-3 text-xs md:text-sm">Time</TableHead>
                    <TableHead className="px-2 py-3 text-xs md:text-sm">Court</TableHead>
                    <TableHead className="px-2 py-3 text-xs md:text-sm">Status</TableHead>
                    <TableHead className="text-right px-2 py-3 text-xs md:text-sm">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myBookings.length > 0 ? (
                    myBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium px-2 py-2 text-xs md:text-sm whitespace-nowrap">
                          {format(new Date(booking.date), "dd/MM/yy")}
                        </TableCell>
                        <TableCell className="px-2 py-2 text-xs md:text-sm">{booking.timeSlot}</TableCell>
                        <TableCell className="px-2 py-2 text-xs md:text-sm whitespace-nowrap">{getCourtName(booking.courtId)}</TableCell>
                        <TableCell className="px-2 py-2">
                          <Badge
                            variant={getStatusVariant(booking.status)}
                            className={`text-xs capitalize ${booking.status === 'arrived' ? 'bg-primary/20 text-primary-foreground' : ''}`}
                          >
                            {booking.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right px-2 py-2">
                          {booking.status === 'booked' && (
                            <Button variant="destructive" size="sm" className="h-8 px-2 text-xs" onClick={() => setCancellationRequest(booking)}>
                              Cancel
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-24 text-center"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <Ticket className="h-8 w-8 text-muted-foreground" />
                           <p>You have no bookings yet.</p>
                           <Button asChild>
                               <Link href="/">Book a Court</Link>
                           </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
    <AlertDialog open={!!cancellationRequest} onOpenChange={() => setCancellationRequest(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action will send a cancellation request to the administrator. You cannot undo this. Are you sure you want to proceed?
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Go back</AlertDialogCancel>
            <AlertDialogAction onClick={handleRequestCancellation}>
                Yes, request cancellation
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
