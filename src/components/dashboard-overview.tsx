
"use client";

import { useMemo } from 'react';
import type { Booking, Court, CourtRate } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Book, CheckCircle, DollarSign, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardOverviewProps {
  bookings: Booking[];
  courts: Court[];
  courtRates: CourtRate;
  selectedDate: Date;
}

const StatCard = ({ title, value, icon: Icon }: { title: string; value: string | number; icon: React.ElementType }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

export function DashboardOverview({ bookings, courts, courtRates, selectedDate }: DashboardOverviewProps) {
  const stats = useMemo(() => {
    const totalBookings = bookings.filter(b => b.status === 'booked' || b.status === 'arrived').length;
    const arrivedCustomers = bookings.filter(b => b.status === 'arrived').length;
    
    const calculateCost = (booking: Booking) => {
      const rate = courtRates[booking.courtId] || 0;
      const duration = booking.timeSlot.split(" & ").length;
      return rate * duration;
    };

    const dailyRevenue = bookings
      .filter(b => b.status === 'completed')
      .reduce((acc, booking) => acc + calculateCost(booking), 0);

    return {
      totalBookings,
      arrivedCustomers,
      dailyRevenue,
    };
  }, [bookings, courtRates]);

  const upcomingBookings = useMemo(() => {
    return bookings
      .filter(b => b.status === 'booked')
      .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot))
      .slice(0, 5);
  }, [bookings]);

  const courtUtilizationData = useMemo(() => {
    const data = courts.map(court => ({
      name: court.name,
      hours: 0,
    }));

    bookings.forEach(booking => {
      if(booking.status === 'booked' || booking.status === 'arrived' || booking.status === 'completed') {
        const courtIndex = data.findIndex(c => c.name === courts.find(ct => ct.id === booking.courtId)?.name);
        if (courtIndex !== -1) {
          const duration = booking.timeSlot.split(" & ").length;
          data[courtIndex].hours += duration;
        }
      }
    });

    return data;
  }, [bookings, courts]);


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Daily Overview for {format(selectedDate, "MMMM d, yyyy")}</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <StatCard title="Total Bookings" value={stats.totalBookings} icon={Book} />
                <StatCard title="Arrived / Pending Payment" value={stats.arrivedCustomers} icon={CheckCircle} />
                <StatCard title="Total Revenue" value={`₭${stats.dailyRevenue.toFixed(0)}`} icon={DollarSign} />
            </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
         <Card>
            <CardHeader>
                <CardTitle>Court Utilization</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={courtUtilizationData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <Tooltip
                            contentStyle={{
                                background: "hsl(var(--background))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "var(--radius)",
                            }}
                        />
                        <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Booked Hours" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Upcoming Arrivals</CardTitle>
            </CardHeader>
            <CardContent>
                {upcomingBookings.length > 0 ? (
                    <ul className="space-y-4">
                    {upcomingBookings.map((booking) => (
                    <li key={booking.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                        <div className="flex items-center gap-4">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="font-semibold">{booking.customerName}</p>
                                <p className="text-sm text-muted-foreground">{booking.customerPhone}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-mono font-medium">{booking.timeSlot.split(' & ')[0].split(' - ')[0]}</p>
                            <p className="text-sm text-muted-foreground">Court {booking.courtId}</p>
                        </div>
                    </li>
                    ))}
                </ul>
                ) : (
                    <div className="flex items-center justify-center h-full text-center py-10 text-muted-foreground">
                        No upcoming arrivals for the selected date.
                    </div>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
