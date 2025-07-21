"use client";

import { useMemo, useState } from "react";
import type { Booking, Court, CourtRate } from "@/lib/types";
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
import { Search } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { PaymentDialog } from "./payment-dialog";

interface PaymentManagementProps {
  bookings: Booking[];
  courts: Court[];
  courtRates: CourtRate;
  onCompleteBooking: (bookingId: string) => void;
}

export function PaymentManagement({ bookings, courts, courtRates, onCompleteBooking }: PaymentManagementProps) {
  const [searchTerm, setSearchTerm] = useDebounce("", 300);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const bookingsForPayment = useMemo(() => {
    return bookings
      .filter((b) => b.status === "arrived")
      .filter(
        (b) =>
          b.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.customerPhone.includes(searchTerm)
      )
      .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
  }, [bookings, searchTerm]);
  
  const handleOpenPaymentDialog = (booking: Booking) => {
    setSelectedBooking(booking);
  };
  
  const handleClosePaymentDialog = () => {
    setSelectedBooking(null);
  };

  const getCourtById = (courtId: number) => {
    return courts.find(c => c.id === courtId);
  }

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>Process Payments</CardTitle>
        <CardDescription>Search for arrived customers on the selected date to process payments.</CardDescription>
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
              {bookingsForPayment.length > 0 ? (
                bookingsForPayment.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">{booking.timeSlot}</TableCell>
                    <TableCell>{getCourtById(booking.courtId)?.name}</TableCell>
                    <TableCell>{booking.customerName}</TableCell>
                    <TableCell>{booking.customerPhone}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => handleOpenPaymentDialog(booking)}>Process Payment</Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No customers waiting for payment.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
    {selectedBooking && getCourtById(selectedBooking.courtId) && (
        <PaymentDialog
          isOpen={!!selectedBooking}
          onClose={handleClosePaymentDialog}
          booking={selectedBooking}
          court={getCourtById(selectedBooking.courtId)!}
          rate={courtRates[selectedBooking.courtId]}
          onCompleteBooking={onCompleteBooking}
        />
      )}
    </>
  );
}
