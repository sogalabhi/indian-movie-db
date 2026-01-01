'use client';

import { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface HelpfulnessButtonsProps {
  reviewId: string;
  initialHelpful: boolean | null;
  initialHelpfulCount: number;
  initialNotHelpfulCount: number;
  className?: string;
  onVoteChange?: (helpful: boolean | null, helpfulCount: number, notHelpfulCount: number) => void;
}

export default function HelpfulnessButtons({
  reviewId,
  initialHelpful,
  initialHelpfulCount,
  initialNotHelpfulCount,
  className,
  onVoteChange,
}: HelpfulnessButtonsProps) {
  const [helpful, setHelpful] = useState<boolean | null>(initialHelpful);
  const [helpfulCount, setHelpfulCount] = useState(initialHelpfulCount);
  const [notHelpfulCount, setNotHelpfulCount] = useState(initialNotHelpfulCount);
  const [loading, setLoading] = useState(false);

  // Sync with props if they change
  useEffect(() => {
    setHelpful(initialHelpful);
    setHelpfulCount(initialHelpfulCount);
    setNotHelpfulCount(initialNotHelpfulCount);
  }, [initialHelpful, initialHelpfulCount, initialNotHelpfulCount]);

  const handleVote = async (newHelpful: boolean) => {
    if (loading) return;

    // If clicking the same vote, remove it
    if (helpful === newHelpful) {
      await handleRemoveVote();
      return;
    }

    // Optimistic update
    const previousHelpful = helpful;
    const previousHelpfulCount = helpfulCount;
    const previousNotHelpfulCount = notHelpfulCount;

    let newHelpfulCount = helpfulCount;
    let newNotHelpfulCount = notHelpfulCount;

    if (previousHelpful === null) {
      // New vote
      if (newHelpful) {
        newHelpfulCount += 1;
      } else {
        newNotHelpfulCount += 1;
      }
    } else {
      // Changing vote
      if (previousHelpful) {
        newHelpfulCount = Math.max(0, helpfulCount - 1);
        newNotHelpfulCount += 1;
      } else {
        newHelpfulCount += 1;
        newNotHelpfulCount = Math.max(0, notHelpfulCount - 1);
      }
    }

    setHelpful(newHelpful);
    setHelpfulCount(newHelpfulCount);
    setNotHelpfulCount(newNotHelpfulCount);
    setLoading(true);

    try {
      const response = await fetch(`/api/reviews/${reviewId}/helpful`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ helpful: newHelpful }),
      });

      if (!response.ok) {
        throw new Error('Failed to update helpfulness vote');
      }

      const data = await response.json();

      // Update with server response
      setHelpful(data.helpful);
      setHelpfulCount(data.helpfulCount);
      setNotHelpfulCount(data.notHelpfulCount);

      // Toast notification
      toast.success(newHelpful ? 'Marked as helpful!' : 'Marked as not helpful');

      // Callback
      if (onVoteChange) {
        onVoteChange(data.helpful, data.helpfulCount, data.notHelpfulCount);
      }
    } catch (error: any) {
      // Rollback on error
      setHelpful(previousHelpful);
      setHelpfulCount(previousHelpfulCount);
      setNotHelpfulCount(previousNotHelpfulCount);
      toast.error('Failed to update vote. Please try again.');
      console.error('Error updating helpfulness vote:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveVote = async () => {
    if (loading) return;

    // Optimistic update
    const previousHelpful = helpful;
    const previousHelpfulCount = helpfulCount;
    const previousNotHelpfulCount = notHelpfulCount;

    let newHelpfulCount = helpfulCount;
    let newNotHelpfulCount = notHelpfulCount;

    if (previousHelpful === true) {
      newHelpfulCount = Math.max(0, helpfulCount - 1);
    } else if (previousHelpful === false) {
      newNotHelpfulCount = Math.max(0, notHelpfulCount - 1);
    }

    setHelpful(null);
    setHelpfulCount(newHelpfulCount);
    setNotHelpfulCount(newNotHelpfulCount);
    setLoading(true);

    try {
      const response = await fetch(`/api/reviews/${reviewId}/helpful`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove helpfulness vote');
      }

      const data = await response.json();

      // Update with server response
      setHelpful(null);
      setHelpfulCount(data.helpfulCount);
      setNotHelpfulCount(data.notHelpfulCount);

      // Toast notification
      toast.success('Vote removed');

      // Callback
      if (onVoteChange) {
        onVoteChange(null, data.helpfulCount, data.notHelpfulCount);
      }
    } catch (error: any) {
      // Rollback on error
      setHelpful(previousHelpful);
      setHelpfulCount(previousHelpfulCount);
      setNotHelpfulCount(previousNotHelpfulCount);
      toast.error('Failed to remove vote. Please try again.');
      console.error('Error removing helpfulness vote:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalVotes = helpfulCount + notHelpfulCount;
  const helpfulPercentage = totalVotes > 0 ? Math.round((helpfulCount / totalVotes) * 100) : 0;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Thumbs Up Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote(true)}
        disabled={loading}
        className={cn(
          'transition-smooth flex items-center gap-1.5 h-8',
          helpful === true && 'bg-primary/10 text-primary'
        )}
        aria-label="Mark as helpful"
      >
        <ThumbsUp className={cn(
          'h-4 w-4',
          helpful === true && 'fill-current'
        )} />
        <span className="text-xs font-medium">{helpfulCount}</span>
      </Button>

      {/* Thumbs Down Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote(false)}
        disabled={loading}
        className={cn(
          'transition-smooth flex items-center gap-1.5 h-8',
          helpful === false && 'bg-destructive/10 text-destructive'
        )}
        aria-label="Mark as not helpful"
      >
        <ThumbsDown className={cn(
          'h-4 w-4',
          helpful === false && 'fill-current'
        )} />
        <span className="text-xs font-medium">{notHelpfulCount}</span>
      </Button>

      {/* Percentage Badge */}
      {totalVotes > 0 && (
        <Badge variant="secondary" className="text-xs">
          {helpfulPercentage}% found this helpful
        </Badge>
      )}
    </div>
  );
}

