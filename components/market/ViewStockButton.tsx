'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ViewStockButtonProps {
  movieId: string | number;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export default function ViewStockButton({
  movieId,
  variant = 'outline',
  size = 'default',
  className,
}: ViewStockButtonProps) {
  const router = useRouter();
  const [stockExists, setStockExists] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStock = async () => {
      try {
        const { data } = await supabase
          .from('movie_stocks')
          .select('current_price, status')
          .eq('id', String(movieId))
          .single();

        if (data) {
          setStockExists(true);
          setCurrentPrice(data.current_price);
        }
      } catch (err) {
        // Stock doesn't exist
        setStockExists(false);
      } finally {
        setLoading(false);
      }
    };

    checkStock();
  }, [movieId]);

  if (loading) {
    return null;
  }

  if (!stockExists) {
    return null;
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={cn('w-full', className)}
      onClick={() => router.push(`/market/${movieId}`)}
    >
      <TrendingUp className="h-4 w-4 mr-2" />
      View Stock
      {currentPrice !== null && (
        <Badge variant="secondary" className="ml-2">
          ₹{currentPrice.toFixed(2)}
        </Badge>
      )}
    </Button>
  );
}

