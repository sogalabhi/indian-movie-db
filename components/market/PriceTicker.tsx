'use client';

import { cn } from '@/lib/utils';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface PriceTickerProps {
  price: number;
  priceChange: number;
  lastUpdated: number;
  size?: 'sm' | 'md' | 'lg';
  showChange?: boolean;
}

export default function PriceTicker({
  price,
  priceChange,
  lastUpdated,
  size = 'lg',
  showChange = true,
}: PriceTickerProps) {
  const isPositive = priceChange >= 0;
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl md:text-4xl',
  };

  return (
    <div className="flex flex-col gap-1">
      <div
        key={lastUpdated} // 🔑 Forces animation reset
        className={cn(
          'font-bold transition-colors duration-300',
          sizeClasses[size],
          isPositive
            ? 'text-primary animate-[flash-green_0.5s_ease-in-out]'
            : 'text-destructive animate-[flash-red_0.5s_ease-in-out]'
        )}
      >
        ₹{price.toFixed(2)}
      </div>
      
      {showChange && (
        <div
          className={cn(
            'flex items-center gap-1 text-sm font-medium',
            isPositive ? 'text-primary' : 'text-destructive'
          )}
        >
          {isPositive ? (
            <ArrowUp className="h-4 w-4" />
          ) : (
            <ArrowDown className="h-4 w-4" />
          )}
          <span>{Math.abs(priceChange).toFixed(2)}%</span>
        </div>
      )}
    </div>
  );
}

