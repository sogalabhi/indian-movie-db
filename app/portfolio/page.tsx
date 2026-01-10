'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { usePortfolio, type PortfolioWithStock } from '@/hooks/usePortfolio';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import PortfolioCard from '@/components/market/PortfolioCard';
import PortfolioSummary from '@/components/market/PortfolioSummary';
import MobileTradingSheet from '@/components/market/MobileTradingSheet';
import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { MovieStock } from '@/lib/market/types';
import CoinBalance from '@/components/CoinBalance';

export default function PortfolioPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { portfolio, loading, error } = usePortfolio(user?.uid || null);
  const [tradingSheetOpen, setTradingSheetOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<MovieStock | null>(null);
  const [tradingType, setTradingType] = useState<'BUY' | 'SELL'>('BUY');

  // Group portfolio by profit/loss
  const gainers = portfolio.filter((p) => {
    if (!p.movie_stocks) return false;
    const currentPrice = p.movie_stocks.current_price;
    return currentPrice > p.avg_buy_price;
  });

  const losers = portfolio.filter((p) => {
    if (!p.movie_stocks) return false;
    const currentPrice = p.movie_stocks.current_price;
    return currentPrice < p.avg_buy_price;
  });

  const neutral = portfolio.filter((p) => {
    if (!p.movie_stocks) return false;
    const currentPrice = p.movie_stocks.current_price;
    return currentPrice === p.avg_buy_price;
  });

  const handleBuy = (stock: MovieStock) => {
    setSelectedStock(stock);
    setTradingType('BUY');
    setTradingSheetOpen(true);
  };

  const handleSell = (stock: MovieStock) => {
    setSelectedStock(stock);
    setTradingType('SELL');
    setTradingSheetOpen(true);
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-6 pb-24 md:pb-6">
        <Alert>
          <AlertDescription>
            Please log in to view your portfolio.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 pb-24 md:pb-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">Portfolio</h1>
          <CoinBalance />
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : portfolio.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 text-6xl">💼</div>
          <h3 className="text-xl font-semibold mb-2">No holdings yet</h3>
          <p className="text-muted-foreground mb-4">
            Start trading to build your portfolio
          </p>
          <Button onClick={() => router.push('/market')}>
            Browse Market
          </Button>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <PortfolioSummary portfolio={portfolio} />

          {/* Gainers Section */}
          {gainers.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-semibold">Gainers</h2>
                <Badge variant="default" className="bg-primary text-primary-foreground">
                  {gainers.length}
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {gainers.map((holding) => (
                  <PortfolioCard
                    key={holding.id}
                    holding={holding}
                    onBuy={() => holding.movie_stocks && handleBuy(holding.movie_stocks)}
                    onSell={() => holding.movie_stocks && handleSell(holding.movie_stocks)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Losers Section */}
          {losers.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingDown className="h-5 w-5 text-destructive" />
                <h2 className="text-2xl font-semibold">Losers</h2>
                <Badge variant="destructive">
                  {losers.length}
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {losers.map((holding) => (
                  <PortfolioCard
                    key={holding.id}
                    holding={holding}
                    onBuy={() => holding.movie_stocks && handleBuy(holding.movie_stocks)}
                    onSell={() => holding.movie_stocks && handleSell(holding.movie_stocks)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Neutral Section */}
          {neutral.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Minus className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-2xl font-semibold">Neutral</h2>
                <Badge variant="secondary">
                  {neutral.length}
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {neutral.map((holding) => (
                  <PortfolioCard
                    key={holding.id}
                    holding={holding}
                    onBuy={() => holding.movie_stocks && handleBuy(holding.movie_stocks)}
                    onSell={() => holding.movie_stocks && handleSell(holding.movie_stocks)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Trading Sheet */}
      <MobileTradingSheet
        open={tradingSheetOpen}
        onOpenChange={setTradingSheetOpen}
        stock={selectedStock}
        type={tradingType}
      />
    </div>
  );
}

