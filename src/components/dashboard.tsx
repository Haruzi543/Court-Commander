"use client";

import { useState } from "react";
import { Settings, Loader2 } from "lucide-react";
import { useBookings } from "@/hooks/use-bookings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CourtScheduleTable } from "@/components/court-schedule-table";
import { ArrivalManagement } from "@/components/arrival-management";
import { SettingsDialog } from "@/components/settings-dialog";
import { Logo } from "@/components/icons";
import type { Booking, Court } from "@/lib/types";
import { COURTS } from "@/lib/constants";

export function Dashboard() {
  const { bookings, courtRates, addBooking, updateBookingStatus, deleteBooking, updateCourtRates, isLoaded } = useBookings();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  if (!isLoaded) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Logo className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Court Commander</h1>
          </div>
          <Button variant="outline" size="icon" onClick={() => setIsSettingsOpen(true)}>
            <Settings className="h-5 w-5" />
            <span className="sr-only">Settings</span>
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8">
        <Tabs defaultValue="schedule">
          <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
            <TabsTrigger value="schedule">Court Schedule</TabsTrigger>
            <TabsTrigger value="arrivals">Arrival Management</TabsTrigger>
          </TabsList>
          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <CardTitle>Today's Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <CourtScheduleTable
                  bookings={bookings}
                  courts={COURTS}
                  courtRates={courtRates}
                  onBookSlot={addBooking}
                  onUpdateBooking={updateBookingStatus}
                  onDeleteBooking={deleteBooking}
                />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="arrivals">
            <ArrivalManagement
              bookings={bookings}
              onUpdateBookingStatus={updateBookingStatus}
            />
          </TabsContent>
        </Tabs>
      </main>

      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        courts={COURTS}
        courtRates={courtRates}
        onSave={updateCourtRates}
      />
    </div>
  );
}
