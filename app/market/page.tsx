'use client';

import { useState } from 'react';
import { useMarketData } from '@/hooks/useMarketData';
import StockCard from '@/components/market/StockCard';
import MobileTradingSheet from '@/components/market/MobileTradingSheet';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Filter, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/app/contexts/AuthContext';
import type { MovieStock } from '@/lib/market/types';
import CoinBalance from '@/components/CoinBalance';

export default function MarketPage() {
  const { user } = useAuth();
  const {
    stocks,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    filterStatus,
    setFilterStatus,
  } = useMarketData();

  const [tradingSheetOpen, setTradingSheetOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<MovieStock | null>(null);
  const [tradingType, setTradingType] = useState<'BUY' | 'SELL'>('BUY');

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

  return (
    <div className="container mx-auto px-4 py-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Market</h1>
            <p className="text-muted-foreground">Trade movie stocks</p>
          </div>
          {user && <CoinBalance />}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search movies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="UPCOMING">Upcoming</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <TrendingUp className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="change_desc">Change: High to Low</SelectItem>
              <SelectItem value="change_asc">Change: Low to High</SelectItem>
              <SelectItem value="name_asc">Name: A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3] rounded-lg" />
          ))}
        </div>
      ) : stocks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 text-6xl">📊</div>
          <h3 className="text-xl font-semibold mb-2">No stocks found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery
              ? 'Try adjusting your search or filters'
              : 'No stocks are currently available'}
          </p>
          {searchQuery && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setFilterStatus('ALL');
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Stock Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {stocks.map((stock) => (
              <StockCard
                key={stock.id}
                stock={stock}
                onBuy={() => handleBuy(stock)}
                onSell={() => handleSell(stock)}
              />
            ))}
          </div>
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

