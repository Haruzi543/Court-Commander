
"use client";

import { useState, useMemo } from "react";
import { format, addDays, startOfToday } from "date-fns";
import { Settings, Loader2, Calendar as CalendarIcon, Clock, LogOut, Ticket } from "lucide-react";
import { useBookings } from "@/hooks/use-bookings";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CourtScheduleTable } from "@/components/court-schedule-table";
import { ArrivalManagement } from "@/components/arrival-management";
import { PaymentManagement } from "@/components/payment-management";
import { HistoryManagement } from "@/components/history-management";
import { SettingsDialog } from "@/components/settings-dialog";
import { RangeBookingDialog } from "@/components/range-booking-dialog";
import { Logo } from "@/components/icons";
import { cn } from "@/lib/utils";
import { DashboardOverview } from "./dashboard-overview";
import { useAuth } from "@/context/auth-context";
import Link from "next/link";

export function Dashboard() {
  const { user, logout } = useAuth();
  const { 
    bookings, 
    courts, 
    timeSlots,
    courtRates, 
    addBooking, 
    updateBookingStatus, 
    completeBooking, 
    updateCourtSettings,
    isLoaded 
  } = useBookings();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRangeBookingOpen, setIsRangeBookingOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const initialTab = user?.role === 'admin' ? "dashboard" : "schedule";
  const [activeTab, setActiveTab] = useState(initialTab);

  const formattedDate = format(selectedDate, "yyyy-MM-dd");

  const dailyBookings = useMemo(() => {
    return bookings.filter(b => b.date === formattedDate);
  }, [bookings, formattedDate]);
  
  const today = startOfToday();

  const handleTabChange = (tab: string) => {
    if (user?.role !== 'admin' && (tab !== 'schedule' && tab !== 'my-bookings')) {
      return;
    }
    setActiveTab(tab);
  };

  if (!isLoaded || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  const isAdmin = user.role === 'admin';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Logo className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Court Commander</h1>
            {isAdmin && <span className="text-sm text-muted-foreground mt-1">({user.email} - {user.role})</span>}
          </div>
          <div className="flex items-center gap-2">
            {!isAdmin && (
                <Button variant="outline" asChild>
                    <Link href="/my-bookings">
                        <Ticket className="mr-2 h-4 w-4" />
                        My Bookings
                    </Link>
                </Button>
            )}
            {isAdmin && (
              <Button variant="outline" size="icon" onClick={() => setIsSettingsOpen(true)}>
                <Settings className="h-5 w-5" />
                <span className="sr-only">Settings</span>
              </Button>
            )}
            <Button variant="outline" size="icon" onClick={logout}>
                <LogOut className="h-5 w-5" />
                <span className="sr-only">Log Out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            {isAdmin ? (
               <TabsList className="grid w-full grid-cols-5 md:w-[600px]">
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
                <TabsTrigger value="arrivals">Arrivals</TabsTrigger>
                <TabsTrigger value="payments">Payments</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>
            ) : (
                <div className="flex-1">
                    <h2 className="text-2xl font-semibold">Booking Schedule</h2>
                    <p className="text-muted-foreground">Select a date and click an available time slot to book a court.</p>
                </div>
            )}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal md:w-[280px]",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  disabled={{ before: today, after: addDays(today, 6) }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
           {isAdmin && (
            <TabsContent value="dashboard">
                <DashboardOverview 
                bookings={dailyBookings} 
                courts={courts}
                courtRates={courtRates}
                selectedDate={selectedDate}
                />
            </TabsContent>
           )}
          <TabsContent value="schedule">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Schedule for {format(selectedDate, "MMMM d, yyyy")}</CardTitle>
                   {!isAdmin && <CardDescription>Welcome, {user.firstName}! Select a slot to start.</CardDescription>}
                   {isAdmin && <CardDescription>Click an available time slot on the grid to book it.</CardDescription>}
                </div>
                <Button variant="outline" onClick={() => setIsRangeBookingOpen(true)}>
                  <Clock className="mr-2" />
                  Book by Range
                </Button>
              </CardHeader>
              <CardContent>
                <CourtScheduleTable
                  bookings={dailyBookings.filter(b => b.status === 'booked' || b.status === 'arrived')}
                  courts={courts}
                  timeSlots={timeSlots}
                  onBookSlot={addBooking}
                  selectedDate={formattedDate}
                  onNavigateToTab={setActiveTab}
                />
              </CardContent>
            </Card>
          </TabsContent>
          {isAdmin && (
            <>
                <TabsContent value="arrivals">
                    <ArrivalManagement
                    bookings={dailyBookings}
                    courts={courts}
                    onUpdateBookingStatus={updateBookingStatus}
                    />
                </TabsContent>
                <TabsContent value="payments">
                    <PaymentManagement
                    bookings={dailyBookings}
                    courts={courts}
                    courtRates={courtRates}
                    onCompleteBooking={completeBooking}
                    />
                </TabsContent>
                <TabsContent value="history">
                    <HistoryManagement
                    bookings={bookings.filter(b => b.status === 'completed')}
                    courts={courts}
                    courtRates={courtRates}
                    />
                </TabsContent>
            </>
          )}
        </Tabs>
      </main>

      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        courts={courts}
        timeSlots={timeSlots}
        courtRates={courtRates}
        onSave={updateCourtSettings}
      />
      <RangeBookingDialog
          isOpen={isRangeBookingOpen}
          onClose={() => setIsRangeBookingOpen(false)}
          courts={courts}
          timeSlots={timeSlots}
          bookings={dailyBookings}
          selectedDate={formattedDate}
          onBook={addBooking}
      />
    </div>
  );
}
