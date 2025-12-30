'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Calendar, BookmarkCheck, Star, LogOut, ArrowLeft, Settings } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const [watchlistCount, setWatchlistCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch watchlist count
  useEffect(() => {
    const fetchWatchlistCount = async () => {
      if (!user) return;
      
      try {
        const response = await fetch('/api/watchlist');
        if (response.ok) {
          const data = await response.json();
          setWatchlistCount(data.watchlist?.length || 0);
        }
      } catch (error) {
        console.error('Error fetching watchlist count:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWatchlistCount();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background text-foreground p-4 md:p-8 pb-20 md:pb-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48 mb-8" />
          <Card className="glass-card">
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-24 w-24 rounded-full mx-auto" />
              <Skeleton className="h-6 w-32 mx-auto" />
              <Skeleton className="h-4 w-48 mx-auto" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  const initials = user.displayName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || user.email?.[0].toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 pb-20 md:pb-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8 animate-fade-in">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full transition-smooth hover-scale"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold text-primary">Profile</h1>
        </div>

        {/* Profile Card */}
        <Card className="glass-card mb-6 animate-scale-in">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <Avatar className="h-20 w-20 md:h-24 md:w-24">
                <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                <AvatarFallback className="text-2xl md:text-3xl bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl md:text-3xl font-bold mb-2">
                  {user.displayName || user.email?.split('@')[0] || 'User'}
                </h2>
                <div className="space-y-2 text-sm md:text-base text-muted-foreground">
                  {user.email && (
                    <div className="flex items-center justify-center md:justify-start gap-2">
                      <Mail className="w-4 h-4" />
                      <span>{user.email}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Member since {new Date().getFullYear()}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 md:gap-6 mb-6">
          <Card className="glass-card hover-scale transition-smooth animate-scale-in" style={{ animationDelay: '100ms' }}>
            <CardContent className="p-4 md:p-6 text-center">
              <BookmarkCheck className="w-6 h-6 md:w-8 md:h-8 text-primary mx-auto mb-2" />
              <div className="text-2xl md:text-3xl font-bold mb-1">
                {watchlistCount !== null ? watchlistCount : '-'}
              </div>
              <div className="text-xs md:text-sm text-muted-foreground">Watchlist Items</div>
            </CardContent>
          </Card>
          <Card className="glass-card hover-scale transition-smooth animate-scale-in" style={{ animationDelay: '200ms' }}>
            <CardContent className="p-4 md:p-6 text-center">
              <Star className="w-6 h-6 md:w-8 md:h-8 text-yellow-500 mx-auto mb-2" />
              <div className="text-2xl md:text-3xl font-bold mb-1">-</div>
              <div className="text-xs md:text-sm text-muted-foreground">Reviews</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="glass-card mb-6 animate-scale-in" style={{ animationDelay: '300ms' }}>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" asChild className="w-full justify-start transition-smooth">
              <Link href="/watchlist" className="flex items-center gap-2">
                <BookmarkCheck className="w-4 h-4" />
                View Watchlist
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full justify-start transition-smooth">
              <Link href="/compare" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Compare Movies
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card className="glass-card animate-scale-in" style={{ animationDelay: '400ms' }}>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Account</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="w-full transition-smooth"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

