'use client';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Line, LineChart, Pie, PieChart, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Booking } from '@/lib/types';
import { useMemo } from 'react';
import { format, subDays, eachDayOfInterval, parseISO } from 'date-fns';

interface RevenueChartProps {
  bookings: Booking[];
}

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function RevenueCharts({ bookings }: RevenueChartProps) {

  const dailyRevenueData = useMemo(() => {
    const last30Days = eachDayOfInterval({
      start: subDays(new Date(), 29),
      end: new Date(),
    });

    return last30Days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const revenue = bookings
        .filter(b => b.status !== 'Cancelled' && format(new Date(b.createdAt), 'yyyy-MM-dd') === dayStr)
        .reduce((sum, b) => sum + b.totalAmount, 0);
      return { date: format(day, 'MMM d'), revenue };
    });
  }, [bookings]);

  const bookingSourceData = useMemo(() => {
    const sources: { [key: string]: number } = {};
    bookings.forEach(b => {
      if (b.status !== 'Cancelled' && b.bookingSource) {
        sources[b.bookingSource] = (sources[b.bookingSource] || 0) + 1;
      }
    });
    return Object.entries(sources).map(([name, value]) => ({ name, value }));
  }, [bookings]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Daily Revenue (Last 30 Days)</CardTitle>
          <CardDescription>Total revenue generated per day.</CardDescription>
        </CardHeader>
        <CardContent>
          {dailyRevenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyRevenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--foreground))" fontSize={12} tickFormatter={(value) => `$${value}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--primary))" }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-center py-10">Not enough data for daily revenue chart.</p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Booking Sources</CardTitle>
          <CardDescription>Distribution of bookings by source.</CardDescription>
        </CardHeader>
        <CardContent>
           {bookingSourceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={bookingSourceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="hsl(var(--primary))"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {bookingSourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
             <p className="text-muted-foreground text-center py-10">No data available for booking sources.</p>
           )}
        </CardContent>
      </Card>
    </div>
  );
}
