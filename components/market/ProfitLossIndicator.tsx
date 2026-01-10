'use client';

import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfitLossIndicatorProps {
  currentPrice: number;
  avgBuyPrice: number;
  quantity: number;
  className?: string;
}

export default function ProfitLossIndicator({
  currentPrice,
  avgBuyPrice,
  quantity,
  className,
}: ProfitLossIndicatorProps) {
  const absolute = (currentPrice - avgBuyPrice) * quantity;
  const percentage = avgBuyPrice > 0
    ? ((currentPrice - avgBuyPrice) / avgBuyPrice) * 100
    : 0;
  const isProfit = absolute >= 0;

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {/* Color-coded display */}
      <div className={cn(
        'flex items-center gap-2',
        isProfit ? 'text-primary' : 'text-destructive'
      )}>
        {/* Badge with percentage */}
        <Badge
          variant={isProfit ? 'default' : 'destructive'}
          className={cn(
            'font-semibold',
            isProfit && 'bg-primary text-primary-foreground'
          )}
        >
          {isProfit ? '+' : '-'}{Math.abs(percentage).toFixed(2)}%
        </Badge>

        {/* Trend arrow */}
        {isProfit ? (
          <TrendingUp className="h-4 w-4 text-primary" />
        ) : (
          <TrendingDown className="h-4 w-4 text-destructive" />
        )}
      </div>

      {/* Absolute value */}
      <div className={cn(
        'text-sm font-medium',
        isProfit ? 'text-primary' : 'text-destructive'
      )}>
        {isProfit ? '+' : '-'}₹{Math.abs(absolute).toFixed(2)}
      </div>
    </div>
  );
}

