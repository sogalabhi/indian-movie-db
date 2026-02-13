'use client';

// Force dynamic rendering to avoid static generation issues with Supabase
export const dynamic = 'force-dynamic';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useStockPrice } from '@/hooks/useStockPrice';
import { useAuth } from '@/app/contexts/AuthContext';
import PriceChart from '@/components/market/PriceChart';
import PriceTicker from '@/components/market/PriceTicker';
import MobileTradingSheet from '@/components/market/MobileTradingSheet';
import ProfitLossIndicator from '@/components/market/ProfitLossIndicator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import type { MovieStock, Portfolio } from '@/lib/market/types';
import Image from 'next/image';
import CoinBalance from '@/components/CoinBalance';
import { cn } from '@/lib/utils';

export default function StockDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const movieId = params.movieId as string;

  const [stock, setStock] = useState<MovieStock | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tradingSheetOpen, setTradingSheetOpen] = useState(false);
  const [tradingType, setTradingType] = useState<'BUY' | 'SELL'>('BUY');

  const { price, priceChange, lastUpdated } = useStockPrice(movieId);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch stock data
        const { data: stockData, error: stockError } = await supabase
          .from('movie_stocks')
          .select('*')
          .eq('id', movieId)
          .single();

        if (stockError) throw stockError;
        setStock(stockData);

        // Trigger lazy update if data is stale (don't wait for it)
        // Check if last_updated is older than 1 hour
        if (stockData.last_updated) {
          const lastUpdated = new Date(stockData.last_updated);
          const now = new Date();
          const hoursSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);

          if (hoursSinceUpdate >= 1) {
            // Trigger update in background (fire and forget)
            fetch(`/api/market/update-price/${movieId}`, {
              method: 'POST',
            }).catch((err) => {
              console.error('Background price update failed:', err);
              // Don't show error to user, just log it
            });
          }
        }

        // Fetch user's portfolio for this stock
        if (user) {
          const { data: portfolioData } = await supabase
            .from('portfolios')
            .select('*')
            .eq('user_id', user.uid)
            .eq('movie_id', movieId)
            .single();

          setPortfolio(portfolioData);
        }
      } catch (err: any) {
        console.error('Error fetching stock data:', err);
        setError(err.message || 'Failed to load stock data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [movieId, user]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 pb-24 md:pb-6">
        <Skeleton className="h-8 w-32 mb-4" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (error || !stock) {
    return (
      <div className="container mx-auto px-4 py-6 pb-24 md:pb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">{error || 'Stock not found'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const posterUrl = stock.poster_path
    ? `https://image.tmdb.org/t/p/w500${stock.poster_path}`
    : '/placeholder-movie.jpg';

  const currentPrice = price ?? stock.current_price;
  const currentChange = priceChange ?? stock.price_change_24h;

  return (
    <div className="container mx-auto px-4 py-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Market
        </Button>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Movie Poster */}
          <div className="w-full md:w-48 flex-shrink-0">
            <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted">
              <Image
                src={posterUrl}
                alt={stock.title}
                fill
                className="object-cover"
                sizes="192px"
              />
            </div>
          </div>

          {/* Stock Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{stock.title}</h1>
                <Badge
                  variant={stock.status === 'ACTIVE' ? 'default' : 'secondary'}
                  className={cn(
                    stock.status === 'ACTIVE' && 'bg-primary text-primary-foreground'
                  )}
                >
                  {stock.status}
                </Badge>
              </div>
              {user && <CoinBalance />}
            </div>

            {/* Price Ticker */}
            <div className="mb-6">
              <PriceTicker
                price={currentPrice}
                priceChange={currentChange}
                lastUpdated={lastUpdated}
                size="lg"
              />
            </div>

            {/* Indices */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-3 bg-secondary rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Hype Index</div>
                <div className="text-lg font-bold text-primary">{stock.hype_index.toFixed(0)}</div>
              </div>
              <div className="text-center p-3 bg-secondary rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Box Office</div>
                <div className="text-lg font-bold text-primary">{stock.box_office_index.toFixed(0)}</div>
              </div>
              <div className="text-center p-3 bg-secondary rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">WOM Index</div>
                <div className="text-lg font-bold text-primary">{stock.wom_index.toFixed(0)}</div>
              </div>
            </div>

            {/* Trading Buttons */}
            <div className="flex gap-3">
              <Button
                size="lg"
                className="flex-1"
                onClick={() => {
                  setTradingType('BUY');
                  setTradingSheetOpen(true);
                }}
              >
                Buy
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setTradingType('SELL');
                  setTradingSheetOpen(true);
                }}
                disabled={!portfolio || portfolio.quantity === 0}
              >
                Sell
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* User Holdings */}
      {portfolio && portfolio.quantity > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your Holdings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Quantity</div>
                <div className="text-lg font-semibold">{portfolio.quantity}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Avg Buy Price</div>
                <div className="text-lg font-semibold">₹{portfolio.avg_buy_price.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Current Value</div>
                <div className="text-lg font-semibold text-primary">
                  ₹{(portfolio.quantity * currentPrice).toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Profit/Loss</div>
                <ProfitLossIndicator
                  currentPrice={currentPrice}
                  avgBuyPrice={portfolio.avg_buy_price}
                  quantity={portfolio.quantity}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Price Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Price Chart
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PriceChart movieId={movieId} />
        </CardContent>
      </Card>

      {/* Trading Sheet */}
      <MobileTradingSheet
        open={tradingSheetOpen}
        onOpenChange={setTradingSheetOpen}
        stock={stock}
        type={tradingType}
        userQuantity={portfolio?.quantity || 0}
      />
    </div>
  );
}

