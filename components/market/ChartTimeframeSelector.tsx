'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type Timeframe = '1H' | '24H' | '7D' | '30D' | 'ALL';

interface ChartTimeframeSelectorProps {
  selected: Timeframe;
  onSelect: (timeframe: Timeframe) => void;
  className?: string;
}

const TIMEFRAMES: Timeframe[] = ['1H', '24H', '7D', '30D', 'ALL'];

export function ChartTimeframeSelector({
  selected,
  onSelect,
  className,
}: ChartTimeframeSelectorProps) {
  return (
    <div className={cn('flex gap-2 overflow-x-auto pb-2', className)}>
      {TIMEFRAMES.map((timeframe) => (
        <Button
          key={timeframe}
          variant={selected === timeframe ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSelect(timeframe)}
          className={cn(
            selected === timeframe && 'bg-primary text-primary-foreground'
          )}
        >
          {timeframe}
        </Button>
      ))}
    </div>
  );
}

