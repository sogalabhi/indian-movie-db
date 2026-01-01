'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bookmark, BookmarkCheck, Loader2 } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface WatchlistButtonProps {
  movieId: string | number;
  movieTitle?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  lazyCheck?: boolean; // Only check watchlist status on hover/click, not on mount
}

export default function WatchlistButton({
  movieId,
  movieTitle,
  variant = 'outline',
  size = 'default',
  className = '',
  lazyCheck = false, // Default to false for backward compatibility
}: WatchlistButtonProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [inWatchlist, setInWatchlist] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(!lazyCheck); // Only check immediately if not lazy
  const [hasChecked, setHasChecked] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  // Check if movie is in watchlist (only if not lazy)
  useEffect(() => {
    if (lazyCheck || hasChecked) {
      return; // Skip if lazy check is enabled or already checked
    }

    const checkWatchlist = async () => {
      if (!user || authLoading) {
        setChecking(false);
        return;
      }

      try {
        const response = await fetch(`/api/watchlist/${movieId}`);
        if (response.ok) {
          const data = await response.json();
          setInWatchlist(data.inWatchlist);
        }
      } catch (error) {
        console.error('Error checking watchlist:', error);
      } finally {
        setChecking(false);
        setHasChecked(true);
      }
    };

    checkWatchlist();
  }, [user, authLoading, movieId, lazyCheck, hasChecked]);

  // Lazy check on hover or click
  const handleInteraction = async () => {
    if (lazyCheck && !hasChecked && user && !authLoading) {
      setChecking(true);
      try {
        const response = await fetch(`/api/watchlist/${movieId}`);
        if (response.ok) {
          const data = await response.json();
          setInWatchlist(data.inWatchlist);
        }
      } catch (error) {
        console.error('Error checking watchlist:', error);
      } finally {
        setChecking(false);
        setHasChecked(true);
      }
    }
  };

  const handleToggle = async () => {
    // Trigger lazy check if needed
    if (lazyCheck && !hasChecked) {
      await handleInteraction();
    }

    // Show login dialog if not authenticated
    if (!user) {
      setShowLoginDialog(true);
      return;
    }

    setLoading(true);
    try {
      if (inWatchlist) {
        // Remove from watchlist
        const response = await fetch(`/api/watchlist/${movieId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setInWatchlist(false);
        } else {
          const error = await response.json();
          console.error('Error removing from watchlist:', error);
        }
      } else {
        // Add to watchlist
        const response = await fetch('/api/watchlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ movieId: String(movieId) }),
        });

        if (response.ok) {
          setInWatchlist(true);
        } else {
          const error = await response.json();
          console.error('Error adding to watchlist:', error);
        }
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    setShowLoginDialog(false);
    router.push('/login');
  };

  if (checking || authLoading) {
    return (
      <Button variant={variant} size={size} disabled className={className}>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleToggle}
        onMouseEnter={lazyCheck ? handleInteraction : undefined}
        disabled={loading}
        className={`${className} transition-smooth hover-scale`}
        title={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : inWatchlist ? (
          <BookmarkCheck className="h-4 w-4 transition-transform duration-200" />
        ) : (
          <Bookmark className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
        )}
        {size !== 'icon' && (
          <span className="ml-2">
            {inWatchlist ? 'In Watchlist' : 'Watchlist'}
          </span>
        )}
      </Button>

      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="glass-modal animate-scale-in">
          <DialogHeader>
            <DialogTitle>Login Required</DialogTitle>
            <DialogDescription>
              You need to be logged in to add movies to your watchlist.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLoginDialog(false)} className="transition-smooth">
              Cancel
            </Button>
            <Button onClick={handleLogin} className="transition-smooth">Login</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
