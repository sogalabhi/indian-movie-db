'use client';

import { cn } from '@/lib/utils';

interface ChartContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function ChartContainer({ children, className }: ChartContainerProps) {
  return (
    <div className={cn('w-full h-full min-h-[300px]', className)}>
      {children}
    </div>
  );
}

