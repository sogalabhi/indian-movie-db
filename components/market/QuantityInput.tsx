'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuantityInputProps {
  value: number;
  onChange: (value: number) => void;
  max: number;
  min?: number;
  price: number;
  type: 'BUY' | 'SELL';
  className?: string;
}

const PRESET_AMOUNTS = [1, 5, 10, 25, 50];

export function QuantityInput({
  value,
  onChange,
  max,
  min = 1,
  price,
  type,
  className,
}: QuantityInputProps) {
  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handlePreset = (amount: number) => {
    onChange(Math.min(amount, max));
  };

  const handleMax = () => {
    onChange(max);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value) || min;
    onChange(Math.max(min, Math.min(newValue, max)));
  };

  const totalCost = price * value;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Main input with +/- buttons */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleDecrement}
          disabled={value <= min}
          className="h-11 w-11"
        >
          <Minus className="h-4 w-4" />
        </Button>

        <Input
          type="number"
          value={value}
          onChange={handleInputChange}
          min={min}
          max={max}
          className="text-center text-lg font-semibold h-11"
        />

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleIncrement}
          disabled={value >= max}
          className="h-11 w-11"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Preset buttons */}
      <div className="flex flex-wrap gap-2">
        {PRESET_AMOUNTS.map((amount) => (
          <Button
            key={amount}
            type="button"
            variant={value === amount ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePreset(amount)}
            disabled={amount > max}
            className={cn(
              value === amount && 'bg-primary text-primary-foreground'
            )}
          >
            {amount}
          </Button>
        ))}
        <Button
          type="button"
          variant={value === max ? 'default' : 'outline'}
          size="sm"
          onClick={handleMax}
          disabled={max === 0}
          className={cn(
            value === max && 'bg-primary text-primary-foreground'
          )}
        >
          Max
        </Button>
      </div>

      {/* Total cost display */}
      <div className="text-center text-sm text-muted-foreground">
        Total {type === 'BUY' ? 'Cost' : 'Proceeds'}:{' '}
        <span className="font-semibold text-primary">₹{totalCost.toFixed(2)}</span>
      </div>
    </div>
  );
}

