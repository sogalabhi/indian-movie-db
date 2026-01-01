'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, ChevronLeft, ChevronRight, MoreVertical, Edit, Trash2, Reply, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAvatarColor, getInitials } from '@/lib/avatar-utils';
import RichTextEditor, { sanitizeHtml } from './RichTextEditor';
import LikeButton from './LikeButton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Comment {
  id: string;
  userId: string;
  reviewId: string;
  parentId?: string;
  body: string;
  likesCount: number;
  createdAt: Date | string | { toMillis?: () => number; getTime?: () => number };
  updatedAt: Date | string | { toMillis?: () => number; getTime?: () => number };
  user: {
    username: string;
    avatarUrl?: string | null;
  };
  children?: Comment[];
}

interface ReviewCommentsProps {
  reviewId: string;
  className?: string;
}

export default function ReviewComments({ reviewId, className }: ReviewCommentsProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'most_liked' | 'most_helpful'>('most_helpful');
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showInput, setShowInput] = useState(true);
  const [commentContent, setCommentContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState<Record<string, string>>({});
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<Record<string, string>>({});
  const [likedComments, setLikedComments] = useState<Record<string, boolean>>({});

  // Fetch comments
  useEffect(() => {
    const fetchComments = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '50', // Fetch more to build tree
          sortBy,
        });

        const response = await fetch(`/api/reviews/${reviewId}/comments?${params.toString()}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch comments');
        }

        const data = await response.json();
        
        // Build comment tree
        const commentMap = new Map<string, Comment>();
        const rootComments: Comment[] = [];

        data.comments.forEach((comment: Comment) => {
          commentMap.set(comment.id, { ...comment, children: [] });
        });

        data.comments.forEach((comment: Comment) => {
          const commentWithChildren = commentMap.get(comment.id)!;
          if (comment.parentId && commentMap.has(comment.parentId)) {
            const parent = commentMap.get(comment.parentId)!;
            if (!parent.children) {
              parent.children = [];
            }
            parent.children.push(commentWithChildren);
          } else {
            rootComments.push(commentWithChildren);
          }
        });

        setComments(rootComments);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);

        // Fetch like status for all comments
        if (user) {
          const likePromises = data.comments.map(async (comment: Comment) => {
            try {
              const likeResponse = await fetch(`/api/reviews/${reviewId}/comments/${comment.id}/like`);
              if (likeResponse.ok) {
                const likeData = await likeResponse.json();
                return { commentId: comment.id, liked: likeData.liked };
              }
            } catch (error) {
              console.error(`Error fetching like status for comment ${comment.id}:`, error);
            }
            return { commentId: comment.id, liked: false };
          });

          const likeResults = await Promise.all(likePromises);
          const likedMap: Record<string, boolean> = {};
          likeResults.forEach(({ commentId, liked }) => {
            likedMap[commentId] = liked;
          });
          setLikedComments(likedMap);
        }
      } catch (err: any) {
        console.error('Error fetching comments:', err);
        setError(err.message || 'Failed to load comments');
        setComments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [reviewId, page, sortBy, user]);

  const handleSortChange = (value: string) => {
    setSortBy(value as typeof sortBy);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handleSubmitComment = async () => {
    if (!user) {
      toast.error('Please login to comment');
      return;
    }

    const sanitizedContent = sanitizeHtml(commentContent);
    const textContent = sanitizedContent.replace(/<[^>]*>/g, '').trim();

    if (!textContent) {
      toast.error('Please enter a comment');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`/api/reviews/${reviewId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commentBody: sanitizedContent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to post comment');
      }

      toast.success('Comment posted!');
      setCommentContent('');
      setShowInput(false);
      
      // Refresh comments
      setPage(1);
      // The useEffect will refetch
    } catch (err: any) {
      console.error('Error posting comment:', err);
      toast.error(err.message || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!user) {
      toast.error('Please login to reply');
      return;
    }

    if (!parentId || typeof parentId !== 'string' || !parentId.trim()) {
      console.error('Invalid parentId in handleSubmitReply:', parentId);
      toast.error('Invalid parent comment ID');
      return;
    }

    const content = replyContent[parentId] || '';
    const sanitizedContent = sanitizeHtml(content);
    const textContent = sanitizedContent.replace(/<[^>]*>/g, '').trim();

    if (!textContent) {
      toast.error('Please enter a reply');
      return;
    }

    setSubmitting(true);

    try {
      const requestBody = {
        commentBody: sanitizedContent,
        parentId: parentId.trim(),
      };

      if (process.env.NODE_ENV === 'development') {
        console.log('Submitting reply with parentId:', requestBody.parentId);
      }

      const response = await fetch(`/api/reviews/${reviewId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to post reply');
      }

      toast.success('Reply posted!');
      setReplyContent({ ...replyContent, [parentId]: '' });
      setReplyingTo(null);
      
      // Refresh comments
      setPage(1);
    } catch (err: any) {
      console.error('Error posting reply:', err);
      toast.error(err.message || 'Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditComment = async (commentId: string) => {
    const content = editContent[commentId] || '';
    const sanitizedContent = sanitizeHtml(content);
    const textContent = sanitizedContent.replace(/<[^>]*>/g, '').trim();

    if (!textContent) {
      toast.error('Please enter a comment');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`/api/reviews/${reviewId}/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          body: sanitizedContent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update comment');
      }

      toast.success('Comment updated!');
      setEditingComment(null);
      setEditContent({ ...editContent, [commentId]: '' });
      
      // Refresh comments
      setPage(1);
    } catch (err: any) {
      console.error('Error updating comment:', err);
      toast.error(err.message || 'Failed to update comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`/api/reviews/${reviewId}/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete comment');
      }

      toast.success('Comment deleted!');
      
      // Refresh comments
      setPage(1);
    } catch (err: any) {
      console.error('Error deleting comment:', err);
      toast.error(err.message || 'Failed to delete comment');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date: Date | string | { toMillis?: () => number; getTime?: () => number }) => {
    try {
      let dateObj: Date;
      
      if (typeof date === 'object' && 'toMillis' in date && typeof date.toMillis === 'function') {
        dateObj = new Date(date.toMillis());
      } else if (typeof date === 'object' && 'getTime' in date && typeof date.getTime === 'function') {
        dateObj = new Date(date.getTime());
      } else if (date instanceof Date) {
        dateObj = date;
      } else if (typeof date === 'string') {
        dateObj = new Date(date);
      } else {
        return 'Unknown date';
      }

      if (isNaN(dateObj.getTime())) {
        return 'Unknown date';
      }

      return dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (error) {
      return 'Unknown date';
    }
  };

  const renderComment = (comment: Comment, depth: number = 0): React.ReactNode => {
    const initials = getInitials(comment.user.username);
    const avatarColor = getAvatarColor(comment.user.username);
    const isOwner = user?.uid === comment.userId;
    const isEditing = editingComment === comment.id;
    const isReplying = replyingTo === comment.id;

    // Check if comment should be auto-hidden (3x threshold)
    // For now, we'll show all comments. Auto-hide logic can be added later based on helpfulness votes

    return (
      <div key={comment.id} className={cn('space-y-3', depth > 0 && 'ml-4 md:ml-8 border-l-2 border-border pl-3 md:pl-4')}>
        <Card className="glass-card">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8 md:h-10 md:w-10 flex-shrink-0">
                <AvatarImage src={comment.user.avatarUrl || undefined} alt={comment.user.username} />
                <AvatarFallback 
                  className="font-semibold text-white text-xs"
                  style={{ backgroundColor: avatarColor }}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <h5 className="font-semibold text-sm md:text-base truncate">{comment.user.username}</h5>
                    <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
                  </div>

                  {isOwner && !isEditing && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingComment(comment.id);
                            setEditContent({ ...editContent, [comment.id]: comment.body });
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-2">
                    <RichTextEditor
                      content={editContent[comment.id] || comment.body}
                      onChange={(content) => setEditContent({ ...editContent, [comment.id]: content })}
                      maxLength={comment.parentId ? 500 : 1000}
                      placeholder="Edit your comment..."
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleEditComment(comment.id)}
                        disabled={submitting}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingComment(null);
                          setEditContent({ ...editContent, [comment.id]: '' });
                        }}
                        disabled={submitting}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div
                      className="text-sm md:text-base text-foreground mb-2 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(comment.body) }}
                    />

                    <div className="flex items-center gap-3">
                      <LikeButton
                        targetId={comment.id}
                        targetType="comment"
                        reviewId={reviewId}
                        initialLiked={likedComments[comment.id] || false}
                        initialCount={comment.likesCount}
                        size="sm"
                        onLikeChange={(liked, count) => {
                          setLikedComments({ ...likedComments, [comment.id]: liked });
                          // Update comment in state
                          const updateComment = (c: Comment): Comment => {
                            if (c.id === comment.id) {
                              return { ...c, likesCount: count };
                            }
                            if (c.children) {
                              return { ...c, children: c.children.map(updateComment) };
                            }
                            return c;
                          };
                          setComments(comments.map(updateComment));
                        }}
                      />

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setReplyingTo(isReplying ? null : comment.id);
                          if (!isReplying) {
                            setReplyContent({ ...replyContent, [comment.id]: '' });
                          }
                        }}
                        className="h-8 text-xs"
                      >
                        <Reply className="h-3 w-3 mr-1" />
                        Reply
                      </Button>
                    </div>
                  </>
                )}

                {isReplying && !isEditing && (
                  <div className="mt-3 space-y-2">
                    <RichTextEditor
                      content={replyContent[comment.id] || ''}
                      onChange={(content) => setReplyContent({ ...replyContent, [comment.id]: content })}
                      maxLength={500}
                      placeholder="Write a reply..."
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleSubmitReply(comment.id)}
                        disabled={submitting}
                      >
                        Post Reply
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyContent({ ...replyContent, [comment.id]: '' });
                        }}
                        disabled={submitting}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Render children (replies) */}
        {comment.children && comment.children.length > 0 && (
          <div className="space-y-3 mt-3">
            {comment.children.map((child) => renderComment(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading && comments.length === 0) {
    return (
      <div className={cn('space-y-4', className)}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="glass-card">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-start gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 md:w-6 md:h-6 text-primary" />
          <h3 className="text-lg md:text-xl font-bold">
            Comments
            {total > 0 && (
              <span className="text-muted-foreground font-normal ml-2">
                ({total} {total === 1 ? 'comment' : 'comments'})
              </span>
            )}
          </h3>
        </div>

        {total > 0 && (
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="most_helpful">Most Helpful</SelectItem>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="most_liked">Most Liked</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive" className="glass-card">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Comment Input */}
      {user && showInput && (
        <Card className="glass-card">
          <CardContent className="p-3 md:p-4">
            <RichTextEditor
              content={commentContent}
              onChange={setCommentContent}
              maxLength={1000}
              placeholder="Write a comment..."
            />
            <div className="flex items-center gap-2 mt-3">
              <Button
                onClick={handleSubmitComment}
                disabled={submitting || !commentContent.trim()}
                size="sm"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Posting...
                  </>
                ) : (
                  'Post Comment'
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowInput(false);
                  setCommentContent('');
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!user && (
        <Card className="glass-card">
          <CardContent className="p-3 md:p-4 text-center">
            <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h4 className="text-lg font-bold mb-2">Login to comment</h4>
            <p className="text-muted-foreground mb-4 text-sm">
              <a href="/login" className="text-primary hover:underline">
                Login
              </a>{' '}
              to join the conversation
            </p>
          </CardContent>
        </Card>
      )}

      {!showInput && user && (
        <Button
          variant="outline"
          onClick={() => setShowInput(true)}
          className="w-full"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Add Comment
        </Button>
      )}

      {/* Comments List */}
      {comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => renderComment(comment))}
        </div>
      ) : !loading && (
        <Card className="glass-card">
          <CardContent className="p-3 md:p-4 text-center">
            <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h4 className="text-lg font-bold mb-2">No comments yet</h4>
            <p className="text-muted-foreground text-sm">
              Be the first to comment!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 pt-4 border-t border-border">
          <div className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1 || loading}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages || loading}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

