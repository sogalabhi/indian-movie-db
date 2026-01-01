'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';
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

interface FollowButtonProps {
  creatorId: string;
  initialFollowing?: boolean;
  initialFollowersCount?: number;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showCount?: boolean;
}

export default function FollowButton({
  creatorId,
  initialFollowing = false,
  initialFollowersCount = 0,
  variant = 'outline',
  size = 'default',
  className = '',
  showCount = true,
}: FollowButtonProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [isFollowing, setIsFollowing] = useState(initialFollowing ?? false);
  const [followersCount, setFollowersCount] = useState(initialFollowersCount ?? 0);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(initialFollowing === undefined);
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  console.log(`🔘 FollowButton: Component mounted for creator ${creatorId}`);

  // Check follow status (only if initialFollowing is not provided)
  useEffect(() => {
    // If we already have initial state, skip the API call
    if (initialFollowing !== undefined) {
      setIsFollowing(initialFollowing);
      setChecking(false);
      return;
    }

    const checkFollowStatus = async () => {
      if (!user || authLoading) {
        setChecking(false);
        return;
      }

      console.log(`🔍 FollowButton: Checking follow status...`);

      try {
        const response = await fetch(`/api/creators/${creatorId}/follow-status`);
        if (response.ok) {
          const data = await response.json();
          setIsFollowing(data.isFollowing);
          console.log(`${data.isFollowing ? '✅' : '❌'} FollowButton: User ${data.isFollowing ? 'is' : 'not'} following`);
        }
      } catch (error) {
        console.error('❌ FollowButton: Error checking follow status:', error);
      } finally {
        setChecking(false);
      }
    };

    checkFollowStatus();
  }, [user, authLoading, creatorId, initialFollowing]);

  const handleToggle = async () => {
    // Show login dialog if not authenticated
    if (!user) {
      setShowLoginDialog(true);
      return;
    }

    setLoading(true);
    const wasFollowing = isFollowing;

    // Optimistic update
    setIsFollowing(!wasFollowing);
    setFollowersCount((prev) => (wasFollowing ? Math.max(0, prev - 1) : prev + 1));

    try {
      if (wasFollowing) {
        console.log(`➖ FollowButton: Unfollowing creator ${creatorId}`);
        const response = await fetch(`/api/creators/${creatorId}/follow`, {
          method: 'DELETE',
        });

        if (response.ok) {
          const data = await response.json();
          setIsFollowing(data.isFollowing);
          setFollowersCount(data.followersCount);
          console.log(`✅ FollowButton: Unfollowed successfully. Count: ${data.followersCount}`);
        } else {
          // Revert optimistic update on error
          setIsFollowing(wasFollowing);
          setFollowersCount((prev) => (wasFollowing ? prev + 1 : Math.max(0, prev - 1)));
          const error = await response.json();
          console.error('❌ FollowButton: Error unfollowing:', error);
        }
      } else {
        console.log(`➕ FollowButton: Following creator ${creatorId}`);
        const response = await fetch(`/api/creators/${creatorId}/follow`, {
          method: 'POST',
        });

        if (response.ok) {
          const data = await response.json();
          setIsFollowing(data.isFollowing);
          setFollowersCount(data.followersCount);
          console.log(`✅ FollowButton: Followed successfully. Count: ${data.followersCount}`);
        } else {
          // Revert optimistic update on error
          setIsFollowing(wasFollowing);
          setFollowersCount((prev) => (wasFollowing ? prev + 1 : Math.max(0, prev - 1)));
          const error = await response.json();
          console.error('❌ FollowButton: Error following:', error);
        }
      }
    } catch (error) {
      // Revert optimistic update on error
      setIsFollowing(wasFollowing);
      setFollowersCount((prev) => (wasFollowing ? prev + 1 : Math.max(0, prev - 1)));
      console.error('❌ FollowButton: Error toggling follow:', error);
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
        disabled={loading}
        className={`${className} transition-smooth`}
        title={isFollowing ? 'Unfollow' : 'Follow'}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isFollowing ? (
          <UserCheck className="h-4 w-4" />
        ) : (
          <UserPlus className="h-4 w-4" />
        )}
        {size !== 'icon' && (
          <span className="ml-2">
            {isFollowing ? 'Following' : 'Follow'}
          </span>
        )}
        {showCount && followersCount > 0 && size !== 'icon' && (
          <span className="ml-2 text-xs opacity-75">
            ({followersCount})
          </span>
        )}
      </Button>

      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="glass-modal animate-scale-in">
          <DialogHeader>
            <DialogTitle>Login Required</DialogTitle>
            <DialogDescription>
              You need to be logged in to follow creators.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLoginDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleLogin}>Login</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

