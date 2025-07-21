"use client";

import { useMemo } from "react";
import type { Booking, Court, CourtRate } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { format } from "date-fns";

interface HistoryManagementProps {
  bookings: Booking[];
  courts: Court[];
  courtRates: CourtRate;
}

export function HistoryManagement({ bookings, courts, courtRates }: HistoryManagementProps) {
  const [searchTerm, setSearchTerm] = useDebounce("", 300);

  const completedBookings = useMemo(() => {
    return bookings
      .filter((b) => b.status === "completed")
      .filter(
        (b) =>
          b.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.customerPhone.includes(searchTerm) ||
          b.date.includes(searchTerm)
      )
      .sort((a, b) => b.date.localeCompare(a.date) || b.timeSlot.localeCompare(a.timeSlot));
  }, [bookings, searchTerm]);

  const getCourtById = (courtId: number) => {
    return courts.find(c => c.id === courtId);
  }

  const calculateCost = (booking: Booking) => {
    const rate = courtRates[booking.courtId] || 0;
    const duration = booking.timeSlot.split(" & ").length;
    return (rate * duration).toFixed(2);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking History</CardTitle>
        <CardDescription>View all past bookings and payments.</CardDescription>
        <div className="relative pt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, or date (YYYY-MM-DD)..."
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
                <TableHead>Date</TableHead>
                <TableHead>Time Slot</TableHead>
                <TableHead>Court</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Amount Paid</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {completedBookings.length > 0 ? (
                completedBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">{format(new Date(booking.date), "PPP")}</TableCell>
                    <TableCell>{booking.timeSlot}</TableCell>
                    <TableCell>{getCourtById(booking.courtId)?.name}</TableCell>
                    <TableCell>{booking.customerName}</TableCell>
                    <TableCell>{booking.customerPhone}</TableCell>
                    <TableCell className="text-right font-mono">${calculateCost(booking)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No completed bookings found.
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
