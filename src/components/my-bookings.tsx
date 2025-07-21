
"use client";

import { useMemo } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Ticket } from "lucide-react";

export function MyBookings() {
  const { user, logout } = useAuth();
  const { bookings, courts, isLoaded } = useBookings();

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
  
  if (!isLoaded || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
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
              Here is a list of all your bookings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Time Slot</TableHead>
                    <TableHead>Court</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myBookings.length > 0 ? (
                    myBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">
                          {format(new Date(booking.date), "PPP")}
                        </TableCell>
                        <TableCell>{booking.timeSlot}</TableCell>
                        <TableCell>{getCourtName(booking.courtId)}</TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={
                              booking.status === "completed"
                                ? "secondary"
                                : booking.status === "arrived"
                                ? "default"
                                : "outline"
                            }
                            className={
                                booking.status === 'arrived' ? 'bg-primary/20 text-primary-foreground' : ''
                            }
                          >
                            {booking.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={4}
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
  );
}
