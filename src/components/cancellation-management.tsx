
"use client";

import { useMemo } from "react";
import type { Booking, Court } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { sendCancellationStatusEmail } from "@/ai/flows/send-cancellation-status-flow";

interface CancellationManagementProps {
  bookings: Booking[];
  courts: Court[];
  onUpdateBookingStatus: (bookingId: string, status: Booking['status']) => void;
}

export function CancellationManagement({ bookings, courts, onUpdateBookingStatus }: CancellationManagementProps) {
  const { toast } = useToast();

  const getCourtName = (courtId: number) => {
    return courts.find(c => c.id === courtId)?.name || "Unknown";
  }

  const getCourtById = (courtId: number) => {
    return courts.find(c => c.id === courtId);
  }

  const cancellationRequests = useMemo(() => {
    return bookings
      .filter((b) => b.status === "cancellation_requested")
      .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
  }, [bookings]);
  
  const handleApprove = async (booking: Booking) => {
    const court = getCourtById(booking.courtId);
    if (!court) {
        toast({ variant: "destructive", title: "Error", description: "Court details not found." });
        return;
    }

    try {
        await sendCancellationStatusEmail({ booking, court, status: 'approved' });
        onUpdateBookingStatus(booking.id, 'cancelled');
        toast({
          title: "Cancellation Approved",
          description: `Booking for ${booking.customerName} has been cancelled. An email has been sent.`
        });
    } catch(e) {
        toast({ variant: "destructive", title: "Email Failed", description: (e as Error).message });
    }
  }

  const handleReject = async (booking: Booking) => {
    const court = getCourtById(booking.courtId);
    if (!court) {
        toast({ variant: "destructive", title: "Error", description: "Court details not found." });
        return;
    }
    try {
        await sendCancellationStatusEmail({ booking, court, status: 'rejected' });
        onUpdateBookingStatus(booking.id, 'booked');
        toast({
          variant: "destructive",
          title: "Cancellation Rejected",
          description: `Booking for ${booking.customerName} has been reinstated. An email has been sent.`
        });
    } catch(e) {
        toast({ variant: "destructive", title: "Email Failed", description: (e as Error).message });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Cancellation Requests</CardTitle>
        <CardDescription>Approve or reject cancellation requests for the selected date.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time Slot</TableHead>
                <TableHead>Court</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cancellationRequests.length > 0 ? (
                cancellationRequests.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">{booking.timeSlot}</TableCell>
                    <TableCell>{getCourtName(booking.courtId)}</TableCell>
                    <TableCell>{booking.customerName}</TableCell>
                    <TableCell>{booking.customerPhone}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleReject(booking)}>Reject</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleApprove(booking)}>Approve Cancellation</Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No cancellation requests for the selected date.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
