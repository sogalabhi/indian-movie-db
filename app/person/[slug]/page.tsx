'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Users, Calendar, MapPin, Film, AlertCircle } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import FollowButton from '@/app/components/FollowButton';
import PersonFilmography from '@/app/components/PersonFilmography';

// Shadcn UI Imports
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Creator {
  id: string;
  name: string;
  role: string;
  slug: string;
  profilePath: string;
  followersCount: number;
}

interface TMDBPerson {
  id: number;
  name: string;
  biography?: string;
  profile_path: string | null;
  birthday?: string;
  place_of_birth?: string;
  known_for_department?: string;
  movie_credits?: {
    cast?: any[];
    crew?: any[];
  };
  images?: {
    profiles?: Array<{ file_path: string }>;
  };
}

export default function PersonDetail() {
  const { slug } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [creator, setCreator] = useState<Creator | null>(null);
  const [tmdbPerson, setTmdbPerson] = useState<TMDBPerson | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log(`👤 PersonDetail: Loading page for slug: ${slug}`);

  // Fetch data in parallel
  useEffect(() => {
    if (!slug) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log(`📡 PersonDetail: Fetching from Firestore (slug: ${slug})...`);

        // Fetch creator data from Firestore (basic stats, followers count)
        const creatorRes = await axios.get(`/api/creators/${slug}`);
        const creatorData = creatorRes.data.creator;
        setCreator(creatorData);

        console.log(`✅ PersonDetail: Firestore data received - ${creatorData.name} (ID: ${creatorData.id})`);

        // Fetch TMDB person data (bio, photos, filmography) - one API call
        console.log(`📡 PersonDetail: Fetching from TMDB (ID: ${creatorData.id})...`);
        const tmdbRes = await axios.get(`/api/tmdb/person/${creatorData.id}`);
        setTmdbPerson(tmdbRes.data);

        console.log(`✅ PersonDetail: TMDB data received`);
        console.log(`📊 PersonDetail: Filmography - ${(tmdbRes.data.movie_credits?.cast?.length || 0) + (tmdbRes.data.movie_credits?.crew?.length || 0)} movies`);

        // Fetch follow status if user is logged in
        if (user) {
          try {
            const followStatusRes = await axios.get(`/api/creators/${creatorData.id}/follow-status`);
            setIsFollowing(followStatusRes.data.isFollowing);
          } catch (err) {
            console.warn('Could not fetch follow status:', err);
          }
        }

        console.log(`🎨 PersonDetail: Rendering page`);
      } catch (error: any) {
        console.error('❌ PersonDetail: Error fetching data:', error);
        if (error.response?.status === 404) {
          setError('Creator not found');
        } else {
          setError(error.response?.data?.error || error.message || 'Failed to load creator');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground pb-20 md:pb-10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <Skeleton className="aspect-[2/3] w-full rounded-xl" />
            </div>
            <div className="md:col-span-2 space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !creator) {
    return (
      <div className="min-h-screen bg-background text-foreground pb-20 md:pb-10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mb-6 glass-card"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Alert variant="destructive" className="glass-card">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error || 'Creator not found'}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const profileImageUrl = tmdbPerson?.profile_path
    ? `https://image.tmdb.org/t/p/w780${tmdbPerson.profile_path}`
    : creator.profilePath
    ? `https://image.tmdb.org/t/p/w780${creator.profilePath}`
    : null;

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 md:pb-10">
      {/* Hero Section with Profile Image */}
      <div
        className="relative h-[40vh] md:h-[50vh] w-full bg-cover bg-center"
        style={
          profileImageUrl
            ? { backgroundImage: `url(${profileImageUrl})` }
            : { background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary)/80 100%)' }
        }
      >
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>

        {/* Back Button */}
        <Button
          size="icon"
          variant="outline"
          onClick={() => router.back()}
          className="absolute top-4 left-4 md:top-6 md:left-6 z-10 glass-card border-none rounded-full transition-smooth hover-scale"
        >
          <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
        </Button>

        {/* Title Overlay */}
        <div className="absolute bottom-6 md:bottom-10 left-4 md:left-6 lg:left-12 max-w-4xl animate-fade-in">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground drop-shadow-lg mb-3 md:mb-4">
            {tmdbPerson?.name || creator.name}
          </h1>
          <div className="flex flex-wrap gap-2 md:gap-4 items-center">
            <Badge variant="secondary" className="text-sm md:text-base glass-card">
              {creator.role}
            </Badge>
            {tmdbPerson?.known_for_department && (
              <Badge variant="outline" className="text-sm md:text-base glass-card">
                {tmdbPerson.known_for_department}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12">
          {/* Left Column: Profile Image & Stats */}
          <div className="md:col-span-1 space-y-6 animate-slide-up">
            {/* Profile Image Card */}
            <Card className="glass-card overflow-hidden shadow-2xl border border-border/50">
              <AspectRatio ratio={2 / 3} className="relative bg-muted">
                {profileImageUrl ? (
                  <Image
                    src={profileImageUrl}
                    alt={creator.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 400px"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                    <span className="text-6xl">🎬</span>
                  </div>
                )}
              </AspectRatio>
            </Card>

            {/* Stats Card */}
            <Card className="glass-card animate-scale-in" style={{ animationDelay: '100ms' }}>
              <CardHeader className="p-3 md:p-4 pb-0">
                <CardTitle className="text-base md:text-lg">Stats</CardTitle>
              </CardHeader>
              <CardContent className="p-3 md:p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">Followers</span>
                  </div>
                  <span className="font-bold text-primary">{creator.followersCount || 0}</span>
                </div>
                <Separator />
                {tmdbPerson?.birthday && (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">Birthday</span>
                      </div>
                      <span className="text-sm">
                        {new Date(tmdbPerson.birthday).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <Separator />
                  </>
                )}
                {tmdbPerson?.place_of_birth && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">Born</span>
                    </div>
                    <span className="text-sm text-right">{tmdbPerson.place_of_birth}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Follow Button Card */}
            <Card className="glass-card animate-scale-in" style={{ animationDelay: '200ms' }}>
              <CardContent className="p-3 md:p-4">
                <FollowButton
                  creatorId={creator.id}
                  initialFollowing={isFollowing}
                  initialFollowersCount={creator.followersCount}
                  variant="default"
                  size="lg"
                  className="w-full glass-primary"
                  showCount={true}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Biography & Filmography */}
          <div className="md:col-span-2 space-y-6 animate-slide-up">
            {/* Biography Card */}
            {tmdbPerson?.biography && (
              <Card className="glass-card animate-scale-in">
                <CardHeader className="p-3 md:p-4 pb-0">
                  <CardTitle className="flex items-center gap-2">
                    <Film className="w-5 h-5" />
                    Biography
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 md:p-4">
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {tmdbPerson.biography}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Filmography Card */}
            {tmdbPerson?.movie_credits && (
              <Card className="glass-card animate-scale-in" style={{ animationDelay: '300ms' }}>
                <CardHeader className="p-3 md:p-4 pb-0">
                  <CardTitle className="flex items-center gap-2">
                    <Film className="w-5 h-5" />
                    Filmography
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 md:p-4">
                  <PersonFilmography movieCredits={tmdbPerson.movie_credits} />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

