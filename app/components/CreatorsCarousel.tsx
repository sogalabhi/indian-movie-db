'use client';

import { useState, useEffect } from 'react';
import { Creator } from '@/lib/types/creator';
import CreatorCard from './CreatorCard';
import FollowButton from './FollowButton';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CreatorsCarouselProps {
  className?: string;
}

export default function CreatorsCarousel({ className = '' }: CreatorsCarouselProps) {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({});

  console.log('🎠 CreatorsCarousel: Component mounted');

  // Fetch creators from Firestore
  useEffect(() => {
    const fetchCreators = async () => {
      console.log('📡 CreatorsCarousel: Fetching from /api/creators...');
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/creators');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch creators');
        }

        const data = await response.json();
        const fetchedCreators = data.creators || [];
        
        console.log(`✅ CreatorsCarousel: Received ${fetchedCreators.length} creators`);
        setCreators(fetchedCreators);

        // Fetch follow status for each creator (if user is logged in)
        // This will be handled by FollowButton component, but we can pre-fetch here if needed
      } catch (error: any) {
        console.error('❌ CreatorsCarousel: Error fetching creators:', error);
        setError(error.message || 'Failed to load creators');
      } finally {
        setLoading(false);
      }
    };

    fetchCreators();
  }, []);

  const handleFollow = (creatorId: string) => {
    setFollowingStates((prev) => ({
      ...prev,
      [creatorId]: !prev[creatorId],
    }));
  };

  const scrollLeft = () => {
    const container = document.getElementById('creators-carousel');
    if (container) {
      container.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    const container = document.getElementById('creators-carousel');
    if (container) {
      container.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  if (loading) {
    console.log('🎨 CreatorsCarousel: Rendering loading state');
    return (
      <div className={className}>
        <div className="flex gap-4 overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="min-w-[200px] glass-card">
              <Skeleton className="w-full aspect-[2/3]" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    console.error('❌ CreatorsCarousel: Error state -', error);
    return (
      <div className={className}>
        <div className="text-center py-8 text-muted-foreground">
          <p>Failed to load creators: {error}</p>
        </div>
      </div>
    );
  }

  if (creators.length === 0) {
    console.log('⚠️ CreatorsCarousel: No creators found');
    return (
      <div className={className}>
        <div className="text-center py-8 text-muted-foreground">
          <p>No creators found</p>
        </div>
      </div>
    );
  }

  console.log(`🎨 CreatorsCarousel: Rendering carousel with ${creators.length} cards`);

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={scrollLeft}
          className="shrink-0"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div
          id="creators-carousel"
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {creators.map((creator) => (
            <div key={creator.id} className="min-w-[200px] flex-shrink-0">
              <CreatorCard
                creator={creator}
                showFollowButton={false} // Follow button will be on detail page
                className="h-full"
              />
            </div>
          ))}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={scrollRight}
          className="shrink-0"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

