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
        fixed bottom-6 right-6 z-50
        h-16 w-16
        rounded-full
        shadow-2xl
        transition-all
        duration-300
        hover:scale-110
        active:scale-95
        group
        ${shouldPulse ? 'animate-pulse' : ''}
      `}
      aria-label={`Compare ${count} movie${count !== 1 ? 's' : ''}`}
    >
      {/* Icon */}
      <Scale className="w-6 h-6" />

      {/* Badge with count */}
      {count > 0 && (
        <span
          className={`
            absolute -top-2 -right-2
            bg-white text-red-600
            rounded-full
            w-6 h-6
            flex items-center justify-center
            text-xs font-bold
            shadow-lg
            transition-transform
            group-hover:scale-110
          `}
        >
          {count}
        </span>
      )}

      {/* Tooltip on hover */}
      <span
        className="
          absolute right-full mr-3
          bg-gray-900 text-white
          px-3 py-2
          rounded-lg
          text-sm
          whitespace-nowrap
          opacity-0
          group-hover:opacity-100
          transition-opacity
          pointer-events-none
          shadow-lg
        "
      >
        Compare {count} movie{count !== 1 ? 's' : ''}
      </span>
    </Button>
  );
}

