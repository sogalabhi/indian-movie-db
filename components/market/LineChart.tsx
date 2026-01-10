'use client';

import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer } from '@/components/ui/chart';
import type { ChartDataPoint } from '@/lib/market/types';

interface LineChartProps {
  data: ChartDataPoint[];
  className?: string;
}

export function LineChart({ data, className }: LineChartProps) {
  // Format data for recharts
  const chartData = data.map((point) => ({
    time: new Date(point.recorded_at).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: point.recorded_at.includes('T') ? 'numeric' : undefined,
    }),
    price: Number(point.price),
    fullTime: point.recorded_at,
  }));

  return (
    <ChartContainer className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="time"
            className="text-xs"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis
            className="text-xs"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={(value) => `₹${value.toFixed(0)}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'calc(var(--radius) - 2px)',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
            formatter={(value: any) => [`₹${value?.toFixed(2)}`, 'Price']}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: 'hsl(var(--primary))' }}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

