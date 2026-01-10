'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { MovieStock } from '@/lib/market/types';

interface TradeConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stock: MovieStock;
  type: 'BUY' | 'SELL';
  quantity: number;
  totalCost: number;
  onConfirm: () => void;
  loading?: boolean;
}

export function TradeConfirmationDialog({
  open,
  onOpenChange,
  stock,
  type,
  quantity,
  totalCost,
  onConfirm,
  loading = false,
}: TradeConfirmationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm {type === 'BUY' ? 'Purchase' : 'Sale'}</DialogTitle>
          <DialogDescription>
            Please review your transaction details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Stock</span>
            <span className="font-medium">{stock.title}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Action</span>
            <span className="font-medium">{type}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Quantity</span>
            <span className="font-medium">{quantity} share{quantity !== 1 ? 's' : ''}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Price per share</span>
            <span className="font-medium">₹{stock.current_price.toFixed(2)}</span>
          </div>

          <div className="flex justify-between pt-2 border-t">
            <span className="text-sm font-semibold">
              Total {type === 'BUY' ? 'Cost' : 'Proceeds'}
            </span>
            <span className="text-lg font-bold text-primary">
              ₹{totalCost.toFixed(2)}
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className="bg-primary text-primary-foreground"
          >
            {loading ? 'Processing...' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

