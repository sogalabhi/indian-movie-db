'use client';

import { useState, useEffect } from 'react';
import { LineChart } from './LineChart';
import { CandlestickChart } from './CandlestickChart';
import { ChartTypeToggle, type ChartType } from './ChartTypeToggle';
import { ChartTimeframeSelector, type Timeframe } from './ChartTimeframeSelector';
import { supabase } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import type { ChartDataPoint } from '@/lib/market/types';

interface PriceChartProps {
  movieId: string;
  className?: string;
}

const TIMEFRAME_HOURS: Record<Timeframe, number> = {
  '1H': 1,
  '24H': 24,
  '7D': 168,
  '30D': 720,
  'ALL': 8760, // ~1 year
};

export default function PriceChart({ movieId, className }: PriceChartProps) {
  const [chartType, setChartType] = useState<ChartType>('line');
  const [timeframe, setTimeframe] = useState<Timeframe>('7D');
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChartData = async () => {
      setLoading(true);
      try {
        const hours = TIMEFRAME_HOURS[timeframe];
        
        // Use the optimized RPC function
        const { data: chartData, error } = await supabase.rpc('get_chart_data', {
          target_movie_id: movieId,
          timeframe_hours: hours,
        });

        if (error) throw error;

        setData(chartData || []);
      } catch (err) {
        console.error('Error fetching chart data:', err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [movieId, timeframe]);

  return (
    <div className={className}>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <ChartTypeToggle chartType={chartType} onTypeChange={setChartType} />
        <ChartTimeframeSelector selected={timeframe} onSelect={setTimeframe} />
      </div>

      {/* Chart */}
      {loading ? (
        <Skeleton className="w-full h-[300px]" />
      ) : data.length === 0 ? (
        <div className="w-full h-[300px] flex items-center justify-center text-muted-foreground">
          No data available
        </div>
      ) : (
        <>
          {chartType === 'line' ? (
            <LineChart data={data} />
          ) : (
            <CandlestickChart data={data} />
          )}
        </>
      )}
    </div>
  );
}

