'use client';

import { useRouter } from 'next/navigation';
import { useComparison } from '../contexts/ComparisonContext';
import { Scale } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

export default function ComparisonFAB() {
  const router = useRouter();
  const { movies } = useComparison();
  const [isVisible, setIsVisible] = useState(false);
  const [shouldPulse, setShouldPulse] = useState(false);

  const count = movies.length;

  // Show/hide FAB based on count
  useEffect(() => {
    setIsVisible(count > 0);
  }, [count]);

  // Pulse animation when count changes
  useEffect(() => {
    if (count > 0) {
      setShouldPulse(true);
      const timer = setTimeout(() => setShouldPulse(false), 600);
      return () => clearTimeout(timer);
    }
  }, [count]);

  const handleClick = () => {
    router.push('/compare');
  };

  if (!isVisible) return null;

  return (
    <Button
      size="icon"
      onClick={handleClick}
      className={`
        fixed bottom-[76px] md:bottom-6 right-4 md:right-6 z-[9998]
        h-14 w-14 md:h-16 md:w-16
        rounded-full
        glass-card
        shadow-2xl
        transition-smooth
        hover-scale
        group
        ${shouldPulse ? 'animate-pulse' : ''}
      `}
      aria-label={`Compare ${count} movie${count !== 1 ? 's' : ''}`}
    >
      {/* Icon */}
      <Scale className="w-5 h-5 md:w-6 md:h-6 transition-transform group-hover:rotate-12" />

      {/* Badge with count */}
      {count > 0 && (
        <span
          className={`
            absolute -top-1 -right-1
            bg-primary text-primary-foreground
            rounded-full
            w-5 h-5 md:w-6 md:h-6
            flex items-center justify-center
            text-[10px] md:text-xs font-bold
            shadow-lg
            transition-transform
            group-hover:scale-110
            glass-card
          `}
        >
          {count}
        </span>
      )}

      {/* Tooltip on hover */}
      <span
        className="
          absolute right-full mr-3
          bg-popover text-popover-foreground
          px-3 py-2
          rounded-lg
          text-xs md:text-sm
          whitespace-nowrap
          opacity-0
          group-hover:opacity-100
          transition-opacity
          pointer-events-none
          shadow-lg
          glass-card
          hidden md:block
        "
      >
        Compare {count} movie{count !== 1 ? 's' : ''}
      </span>
    </Button>
  );
}

