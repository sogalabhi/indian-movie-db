'use client';

import { cn } from '@/lib/utils';

interface AnimatedPriceProps {
  price: number;
  priceChange: number;
  lastUpdated: number; // 🔑 Key for animation
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function AnimatedPrice({ 
  price, 
  priceChange, 
  lastUpdated,
  className,
  size = 'md'
}: AnimatedPriceProps) {
  const isPositive = priceChange >= 0;
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <div
      key={lastUpdated} // 🔑 Forces React to recreate element
      className={cn(
        'transition-all duration-300 font-bold',
        sizeClasses[size],
        isPositive
          ? 'text-primary animate-[flash-green_0.5s_ease-in-out]'
          : 'text-destructive animate-[flash-red_0.5s_ease-in-out]',
        className
      )}
    >
      ₹{price.toFixed(2)}
    </div>
  );
}

