'use client';
import { useBookings } from '@/hooks/useBookings';
import RevenueStats from '@/components/revenue/RevenueStats';
import RevenueCharts from '@/components/revenue/RevenueChart'; // Assuming this component will contain charts
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart } from 'lucide-react';

export default function RevenuePage() {
  const { bookings, loading } = useBookings();

  if (loading) {
    return (
      <div className="py-8">
        <div className="flex justify-between items-center mb-8">
          <Skeleton className="h-10 w-48" />
        </div>
        {/* Skeleton for Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4 border rounded-lg shadow space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-8 w-1/2" />
            </div>
          ))}
        </div>
        {/* Skeleton for Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-4 border rounded-lg shadow space-y-2 h-[380px]">
                <Skeleton className="h-6 w-1/2 mb-4"/>
                <Skeleton className="h-full w-full"/>
            </div>
            <div className="p-4 border rounded-lg shadow space-y-2 h-[380px]">
                <Skeleton className="h-6 w-1/2 mb-4"/>
                <Skeleton className="h-full w-full"/>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold font-headline text-primary">Revenue Dashboard</h1>
      </div>

      {bookings.length === 0 ? (
         <div className="text-center py-10">
          <BarChart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-xl text-muted-foreground mb-4">No booking data available.</p>
          <p className="text-muted-foreground">Revenue analytics will appear here once bookings are added.</p>
        </div>
      ) : (
        <>
          <RevenueStats bookings={bookings} />
          <RevenueCharts bookings={bookings} />
        </>
      )}
    </div>
  );
}
