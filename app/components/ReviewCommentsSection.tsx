'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ReviewComments from './ReviewComments';
import { cn } from '@/lib/utils';

interface ReviewCommentsSectionProps {
  reviewId: string;
  reviewSummary?: {
    username: string;
    rating: number;
    body?: string;
  };
  commentsCount: number;
  className?: string;
}

export default function ReviewCommentsSection({
  reviewId,
  reviewSummary,
  commentsCount,
  className,
}: ReviewCommentsSectionProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={cn('space-y-2', className)}>
      <Button
        variant="ghost"
        onClick={() => setExpanded(!expanded)}
        className="w-full justify-between h-auto py-2"
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          <span className="font-medium">
            {expanded ? 'Hide Comments' : 'View Comments'}
          </span>
          {commentsCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {commentsCount}
            </Badge>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>

      {expanded && (
        <div className="animate-in slide-in-from-top-2 duration-200">
          {reviewSummary && (
            <Card className="glass-card mb-4">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{reviewSummary.username}</span>
                      <span className="text-xs text-muted-foreground">
                        {reviewSummary.rating}/10
                      </span>
                    </div>
                    {reviewSummary.body && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {reviewSummary.body}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          <ReviewComments reviewId={reviewId} />
        </div>
      )}
    </div>
  );
}

