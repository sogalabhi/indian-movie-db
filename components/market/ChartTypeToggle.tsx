'use client';

import { Button } from '@/components/ui/button';
import { LineChart, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ChartType = 'line' | 'candlestick';

interface ChartTypeToggleProps {
  chartType: ChartType;
  onTypeChange: (type: ChartType) => void;
  className?: string;
}

export function ChartTypeToggle({
  chartType,
  onTypeChange,
  className,
}: ChartTypeToggleProps) {
  return (
    <div className={cn('flex gap-2', className)}>
      <Button
        variant={chartType === 'line' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onTypeChange('line')}
        className={cn(
          chartType === 'line' && 'bg-primary text-primary-foreground'
        )}
      >
        <LineChart className="h-4 w-4 mr-1" />
        Line
      </Button>
      <Button
        variant={chartType === 'candlestick' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onTypeChange('candlestick')}
        className={cn(
          chartType === 'candlestick' && 'bg-primary text-primary-foreground'
        )}
      >
        <BarChart3 className="h-4 w-4 mr-1" />
        Candle
      </Button>
    </div>
  );
}

