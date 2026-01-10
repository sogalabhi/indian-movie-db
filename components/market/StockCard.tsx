'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MovieStock } from '@/lib/market/types';
import { useStockPrice } from '@/hooks/useStockPrice';
import Image from 'next/image';

interface StockCardProps {
  stock: MovieStock;
  onBuy?: () => void;
  onSell?: () => void;
}

export default function StockCard({ stock, onBuy, onSell }: StockCardProps) {
  const { price, priceChange, lastUpdated } = useStockPrice(stock.id);
  const displayPrice = price ?? stock.current_price;
  const displayChange = priceChange ?? stock.price_change_24h;
  const isPositive = displayChange >= 0;

  const posterUrl = stock.poster_path
    ? `https://image.tmdb.org/t/p/w500${stock.poster_path}`
    : '/placeholder-movie.jpg';

  return (
    <Link href={`/market/${stock.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
        <AspectRatio ratio={2 / 3} className="bg-muted">
          <Image
            src={posterUrl}
            alt={stock.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 33vw"
          />
          <div className="absolute top-2 right-2">
            <Badge 
              variant={stock.status === 'ACTIVE' ? 'default' : 'secondary'}
              className={cn(
                stock.status === 'ACTIVE' && 'bg-primary text-primary-foreground'
              )}
            >
              {stock.status}
            </Badge>
          </div>
        </AspectRatio>
        
        <CardContent className="p-4">
          <h3 className="font-semibold text-sm mb-2 line-clamp-2 min-h-[2.5rem]">
            {stock.title}
          </h3>
          
          {/* Large bold price */}
          <div className="mb-2">
            <div 
              key={lastUpdated}
              className={cn(
                'text-2xl font-bold transition-colors duration-300',
                isPositive ? 'text-primary' : 'text-destructive'
              )}
            >
              ₹{displayPrice.toFixed(2)}
            </div>
            
            {/* 24h change indicator */}
            <div className={cn(
              'flex items-center gap-1 text-sm font-medium mt-1',
              isPositive ? 'text-primary' : 'text-destructive'
            )}>
              {isPositive ? (
                <ArrowUp className="h-3.5 w-3.5" />
              ) : (
                <ArrowDown className="h-3.5 w-3.5" />
              )}
              <span>{Math.abs(displayChange).toFixed(2)}%</span>
            </div>
          </div>

          {/* Quick action buttons */}
          <div className="flex gap-2 mt-3" onClick={(e) => e.preventDefault()}>
            <Button
              size="sm"
              className="flex-1 text-xs"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onBuy?.();
              }}
            >
              Buy
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSell?.();
              }}
            >
              Sell
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

