'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { BookingStatus } from '@/types/booking.types';

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string }> = {
  confirmed: { label: 'Confirmed', color: 'hsl(142 76% 36%)' },
  rejected: { label: 'Rejected', color: 'hsl(0 72% 51%)' },
  cancelled: { label: 'Cancelled', color: 'hsl(38 92% 50%)' },
};

interface BookingStatusChartProps {
  data: Record<BookingStatus, number>;
  isLoading?: boolean;
}

export function BookingStatusChart({ data, isLoading = false }: BookingStatusChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-[180px] mb-1" />
          <Skeleton className="h-4 w-[240px]" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full rounded-md" />
        </CardContent>
      </Card>
    );
  }

  const chartData = (Object.entries(STATUS_CONFIG) as [BookingStatus, typeof STATUS_CONFIG['confirmed']][])
    .map(([status, config]) => ({
      name: config.label,
      value: data[status] ?? 0,
      color: config.color,
    }))
    .filter((d) => d.value > 0);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Booking Status</CardTitle>
          <CardDescription>Distribution by status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[250px] text-sm text-muted-foreground">
            No booking data yet.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Booking Status</CardTitle>
        <CardDescription>Distribution of bookings by status</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={95}
              paddingAngle={2}
              dataKey="value"
              animationBegin={0}
              animationDuration={800}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid hsl(var(--border))',
                backgroundColor: 'hsl(var(--popover))',
                color: 'hsl(var(--popover-foreground))',
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              iconSize={8}
              formatter={(value: string) => (
                <span className="text-sm text-muted-foreground">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}