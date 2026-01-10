'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import ProfitLossIndicator from './ProfitLossIndicator';
import { formatProfitLoss } from '@/lib/market/portfolio-utils';
import type { PortfolioWithStock } from '@/hooks/usePortfolio';
import Image from 'next/image';
import Link from 'next/link';

interface PortfolioCardProps {
  holding: PortfolioWithStock;
  onBuy?: () => void;
  onSell?: () => void;
}

export default function PortfolioCard({
  holding,
  onBuy,
  onSell,
}: PortfolioCardProps) {
  if (!holding.movie_stocks) return null;

  const stock = holding.movie_stocks;
  const currentPrice = stock.current_price;
  const { absolute, percentage, isProfit } = formatProfitLoss(
    currentPrice,
    holding.avg_buy_price,
    holding.quantity
  );

  const posterUrl = stock.poster_path
    ? `https://image.tmdb.org/t/p/w500${stock.poster_path}`
    : '/placeholder-movie.jpg';

  return (
    <Card className="overflow-hidden">
      <Link href={`/market/${stock.id}`}>
        <AspectRatio ratio={2 / 3} className="bg-muted">
          <Image
            src={posterUrl}
            alt={stock.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </AspectRatio>
      </Link>

      <CardContent className="p-4">
        <Link href={`/market/${stock.id}`}>
          <h3 className="font-semibold text-sm mb-3 line-clamp-2 hover:text-primary transition-colors">
            {stock.title}
          </h3>
        </Link>

        <div className="space-y-2 mb-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Quantity</span>
            <span className="font-medium">{holding.quantity}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Avg Buy Price</span>
            <span className="font-medium">₹{holding.avg_buy_price.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Current Price</span>
            <span className="font-medium text-primary">₹{currentPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Current Value</span>
            <span className="font-medium text-primary">
              ₹{(holding.quantity * currentPrice).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Profit/Loss Indicator */}
        <div className="mb-4">
          <ProfitLossIndicator
            currentPrice={currentPrice}
            avgBuyPrice={holding.avg_buy_price}
            quantity={holding.quantity}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2" onClick={(e) => e.preventDefault()}>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onBuy?.();
            }}
          >
            Buy More
          </Button>
          <Button
            size="sm"
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
  );
}

