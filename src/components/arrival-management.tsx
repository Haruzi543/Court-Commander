
"use client";

import { useMemo } from "react";
import type { Booking, Court } from "@/lib/types";
import { Input } from "@/components/ui/input";
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
import { Search } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

interface ArrivalManagementProps {
  bookings: Booking[];
  courts: Court[];
  onUpdateBookingStatus: (bookingId: string, status: "booked" | "arrived") => void;
}

export function ArrivalManagement({ bookings, courts, onUpdateBookingStatus }: ArrivalManagementProps) {
  const [searchTerm, setSearchTerm] = useDebounce("", 300);
  const { toast } = useToast();

  const getCourtName = (courtId: number) => {
    return courts.find(c => c.id === courtId)?.name || "Unknown";
  }

  const upcomingBookings = useMemo(() => {
    return bookings
      .filter((b) => b.status === "booked")
      .filter(
        (b) =>
          b.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.customerPhone.includes(searchTerm)
      )
      .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
  }, [bookings, searchTerm]);
  
  const handleMarkArrived = (booking: Booking) => {
    onUpdateBookingStatus(booking.id, 'arrived');
    toast({
      title: "Customer Arrived",
      description: `${booking.customerName} has been marked as arrived.`
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Arrivals</CardTitle>
        <CardDescription>Search for bookings on the selected date and mark customers as arrived.</CardDescription>
        <div className="relative pt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or phone..."
            defaultValue={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
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
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upcomingBookings.length > 0 ? (
                upcomingBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">{booking.timeSlot}</TableCell>
                    <TableCell>{getCourtName(booking.courtId)}</TableCell>
                    <TableCell>{booking.customerName}</TableCell>
                    <TableCell>{booking.customerPhone}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => handleMarkArrived(booking)}>Mark Arrived</Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No upcoming bookings found.
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
