'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';
import type { LocationType } from '@/types/location.types';

const TYPE_COLORS: Record<LocationType, string> = {
  building: 'hsl(221 83% 53%)',
  floor: 'hsl(262 83% 58%)',
  room: 'hsl(142 76% 36%)',
};

const TYPE_LABELS: Record<LocationType, string> = {
  building: 'Building',
  floor: 'Floor',
  room: 'Room',
};

interface LocationTypeChartProps {
  data: Record<LocationType, number>;
  isLoading?: boolean;
}

export function LocationTypeChart({ data, isLoading = false }: LocationTypeChartProps) {
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

  const chartData = (Object.entries(TYPE_LABELS) as [LocationType, string][])
    .map(([type, label]) => ({
      name: label,
      value: data[type] ?? 0,
      color: TYPE_COLORS[type],
    }))
    .filter((d) => d.value > 0);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Locations by Type</CardTitle>
          <CardDescription>Breakdown of building, floor, room</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[250px] text-sm text-muted-foreground">
            No location data yet.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Locations by Type</CardTitle>
        <CardDescription>Breakdown of building, floor, and room</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={false}
              allowDecimals={false}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} animationDuration={800}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}