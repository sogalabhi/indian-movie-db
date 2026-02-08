'use client';

import { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, ColorType } from 'lightweight-charts';
import { ChartContainer } from '@/components/ui/chart';
import type { ChartDataPoint } from '@/lib/market/types';

interface CandlestickChartProps {
  data: ChartDataPoint[];
  className?: string;
}

export function CandlestickChart({ data, className }: CandlestickChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'hsl(var(--foreground))',
      },
      grid: {
        vertLines: { color: 'hsl(var(--border))' },
        horzLines: { color: 'hsl(var(--border))' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 300,
    });

    // Create candlestick series
    // Type assertion needed for lightweight-charts v5 TypeScript definitions
    const candlestickSeries = (chart as any).addCandlestickSeries({
      upColor: 'hsl(var(--primary))',
      downColor: 'hsl(var(--destructive))',
      borderVisible: false,
      wickUpColor: 'hsl(var(--primary))',
      wickDownColor: 'hsl(var(--destructive))',
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    // Format data for lightweight-charts
    // For candlestick, we need OHLC data. Since we only have price,
    // we'll create simple candles (open=close=high=low=price)
    const candlestickData = data.map((point) => {
      const price = Number(point.price);
      const time = new Date(point.recorded_at).getTime() / 1000; // Unix timestamp
      return {
        time: time as any,
        open: price,
        high: price,
        low: price,
        close: price,
      };
    });

    candlestickSeries.setData(candlestickData);

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data]);

  return (
    <ChartContainer className={className}>
      <div ref={chartContainerRef} className="w-full h-[300px]" />
    </ChartContainer>
  );
}

