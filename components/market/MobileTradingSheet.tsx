'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QuantityInput } from './QuantityInput';
import { TradeConfirmationDialog } from './TradeConfirmationDialog';
import { useAuth } from '@/app/contexts/AuthContext';
import CoinBalance from '@/components/CoinBalance';
import { toast } from 'sonner';
import { Coins } from 'lucide-react';
import type { MovieStock } from '@/lib/market/types';

interface MobileTradingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stock: MovieStock | null;
  type: 'BUY' | 'SELL';
  userBalance?: number;
  userQuantity?: number; // For sell: how many shares user owns
}

export default function MobileTradingSheet({
  open,
  onOpenChange,
  stock,
  type,
  userBalance = 0,
  userQuantity = 0,
}: MobileTradingSheetProps) {
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentPrice = stock?.current_price || 0;
  const totalCost = type === 'BUY' ? currentPrice * quantity : currentPrice * quantity;
  const maxQuantity = type === 'BUY'
    ? Math.floor(userBalance / currentPrice)
    : userQuantity;

  useEffect(() => {
    if (!open) {
      setQuantity(1);
      setShowConfirmation(false);
    }
  }, [open]);

  const handleTrade = async () => {
    if (!user || !stock) return;

    setLoading(true);
    try {
      const endpoint = type === 'BUY' ? '/api/market/buy' : '/api/market/sell';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          movieId: stock.id,
          quantity,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Transaction failed');
      }

      // Success toast with coin animation
      toast.success(
        <div className="flex items-center gap-2">
          <Coins className="h-4 w-4 animate-bounce" />
          <span>
            {type === 'BUY' ? 'Purchased' : 'Sold'} {quantity} share{quantity !== 1 ? 's' : ''} of {stock.title}
          </span>
        </div>,
        {
          duration: 3000,
        }
      );

      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  if (!stock) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {type === 'BUY' ? 'Buy' : 'Sell'} {stock.title}
            </DialogTitle>
            <DialogDescription>
              Current price: ₹{currentPrice.toFixed(2)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* User balance */}
            <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
              <span className="text-sm text-muted-foreground">
                {type === 'BUY' ? 'Available Balance' : 'Shares Owned'}
              </span>
              {type === 'BUY' ? (
                <CoinBalance variant="compact" />
              ) : (
                <span className="font-semibold text-primary">{userQuantity}</span>
              )}
            </div>

            {/* Quantity input */}
            <div className="space-y-2">
              <Label>Quantity</Label>
              <QuantityInput
                value={quantity}
                onChange={setQuantity}
                max={maxQuantity}
                min={1}
                price={currentPrice}
                type={type}
              />
            </div>

            {/* Total calculation */}
            <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
              <span className="text-sm font-medium">Total {type === 'BUY' ? 'Cost' : 'Proceeds'}</span>
              <span className="text-lg font-bold text-primary">
                ₹{totalCost.toFixed(2)}
              </span>
            </div>

            {/* Action button */}
            <Button
              className="w-full"
              size="lg"
              onClick={() => setShowConfirmation(true)}
              disabled={loading || quantity <= 0 || quantity > maxQuantity}
            >
              {loading ? 'Processing...' : `${type === 'BUY' ? 'Buy' : 'Sell'} ${quantity} Share${quantity !== 1 ? 's' : ''}`}
            </Button>

            {quantity > maxQuantity && (
              <p className="text-sm text-destructive text-center">
                {type === 'BUY'
                  ? 'Insufficient balance'
                  : 'Insufficient shares'}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation dialog */}
      <TradeConfirmationDialog
        open={showConfirmation}
        onOpenChange={setShowConfirmation}
        stock={stock}
        type={type}
        quantity={quantity}
        totalCost={totalCost}
        onConfirm={handleTrade}
        loading={loading}
      />
    </>
  );
}

