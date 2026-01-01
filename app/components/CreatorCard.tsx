'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Creator } from '@/lib/types/creator';
import { Card, CardContent } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';

interface CreatorCardProps {
  creator: Creator;
  showFollowButton?: boolean;
  onFollow?: (creatorId: string) => void;
  isFollowing?: boolean;
  className?: string;
}

export default function CreatorCard({
  creator,
  showFollowButton = false,
  onFollow,
  isFollowing = false,
  className = '',
}: CreatorCardProps) {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);

  console.log(`🃏 CreatorCard: Rendering card for ${creator.name} (ID: ${creator.id})`);
  console.log(`🖼️ CreatorCard: Profile image: ${creator.profilePath || 'missing'}`);

  const handleClick = () => {
    router.push(`/person/${creator.slug}`);
  };

  const imageUrl = creator.profilePath && !imageError
    ? `https://image.tmdb.org/t/p/w500${creator.profilePath}`
    : null;

  console.log(`🖼️ CreatorCard: Image URL for ${creator.name}: ${imageUrl || 'No image'}`);

  return (
    <Card
      className={`cursor-pointer glass-card hover:shadow-lg transition-all duration-200 overflow-hidden ${className}`}
      onClick={handleClick}
    >
      <CardContent className="p-0">
        <AspectRatio ratio={2 / 3} className="relative bg-muted overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={creator.name}
              className="w-full h-full object-cover"
              onError={() => {
                console.error(`❌ CreatorCard: Failed to load image for ${creator.name} - URL: ${imageUrl}`);
                setImageError(true);
              }}
              onLoad={() => {
                console.log(`✅ CreatorCard: Image loaded successfully for ${creator.name}`);
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
              <span className="text-4xl">🎬</span>
            </div>
          )}
        </AspectRatio>
        <div className="p-3 md:p-4">
          <h3 className="font-semibold text-sm md:text-base mb-2 line-clamp-2">{creator.name}</h3>
          <div className="flex items-center justify-between gap-2">
            <Badge variant="secondary" className="text-xs">
              {creator.role}
            </Badge>
            {showFollowButton && onFollow && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFollow(creator.id);
                }}
                className={`text-xs px-2 py-1 rounded ${
                  isFollowing
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
          </div>
          {creator.followersCount !== undefined && creator.followersCount > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              {creator.followersCount} {creator.followersCount === 1 ? 'follower' : 'followers'}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

