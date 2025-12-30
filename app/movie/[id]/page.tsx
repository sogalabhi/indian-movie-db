'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import { Star, Trophy, ArrowLeft, Tv, Users, Clapperboard, Scale, Check, AlertCircle } from 'lucide-react';
import { useComparison } from '../../contexts/ComparisonContext';
import { useAuth } from '../../contexts/AuthContext';
import WatchlistButton from '../../components/WatchlistButton';
import MarkWatchedButton from '../../components/MarkWatchedButton';
import RatingButton from '../../components/RatingButton';
import ReviewsSection from '../../components/ReviewsSection';
import { fetchImdbAwards } from '@/lib/movie-utils';

// Shadcn UI Imports
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function MovieDetail() {
    const { id } = useParams();
    const router = useRouter();
    const { addToCompare, isInComparison, canAddMore } = useComparison();
    const { user } = useAuth();

    const [movie, setMovie] = useState<any>(null);
    const [omdb, setOmdb] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [detailedAwards, setDetailedAwards] = useState([]);
    const [isAddingToCompare, setIsAddingToCompare] = useState(false);
    const [userRating, setUserRating] = useState<{ rating: number; body?: string } | null>(null);

    useEffect(() => {
        if (omdb?.imdbID) {
            fetchImdbAwards(omdb.imdbID)
                .then((awards: any[]) => setDetailedAwards(awards as []))
                .catch(err => console.error('Error fetching awards:', err));
        }
    }, [omdb]);

    useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            console.log('Fetching movie data for ID:', id);
            try {
                // Fetch TMDB data via API route with timeout
                console.log('Calling API route:', `/api/movies/${id}?append_to_response=external_ids,watch/providers`);
                const tmdbRes = await axios.get(
                    `/api/movies/${id}?append_to_response=external_ids,watch/providers`,
                    { timeout: 15000 } // 15 second timeout
                );
                console.log('TMDB response received:', tmdbRes.status);
                
                if (tmdbRes.data.error) {
                    throw new Error(tmdbRes.data.error);
                }
                
                const tmdbData = tmdbRes.data;
                setMovie(tmdbData);

                // Fetch OMDB data via API route if IMDB ID is available
                if (tmdbData.external_ids?.imdb_id) {
                    try {
                        const omdbRes = await axios.get(
                            `/api/omdb?imdbId=${tmdbData.external_ids.imdb_id}&plot=full`,
                            { timeout: 10000 } // 10 second timeout
                        );
                        
                        if (!omdbRes.data.error) {
                            setOmdb(omdbRes.data);
                        }
                    } catch (omdbError) {
                        console.error('Error fetching OMDB data:', omdbError);
                        // Continue without OMDB data if it fails
                    }
                }
            } catch (error: any) {
                console.error('Error fetching data:', error);
                console.error('Error response:', error.response);
                
                // Check if it's a timeout error from the API route (504 status)
                if (error.response?.status === 504 || error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
                    setError(error.response?.data?.error || 'Request timed out. TMDB API is slow or unavailable. Please try again later.');
                } else {
                    const errorMsg = error.response?.data?.error || error.message || 'Failed to load movie details';
                    setError(errorMsg);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    // Fetch user's rating for this movie
    const fetchUserRating = async () => {
        if (!user || !id) {
            setUserRating(null);
            return;
        }

        try {
            const response = await fetch(`/api/reviews/${id}`);
            if (response.ok) {
                const data = await response.json();
                if (data.review) {
                    setUserRating({
                        rating: data.review.rating,
                        body: data.review.body,
                    });
                } else {
                    setUserRating(null);
                }
            }
        } catch (error) {
            console.error('Error fetching user rating:', error);
        }
    };

    useEffect(() => {
        fetchUserRating();
    }, [user, id]);

    // Loading State with Skeletons
    if (loading) return (
        <div className="min-h-screen bg-background p-4 md:p-6 pb-20 md:pb-10 space-y-6 md:space-y-8">
            <Skeleton className="h-[40vh] md:h-[50vh] w-full rounded-xl animate-pulse" />
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12">
                <div className="space-y-4">
                    <Skeleton className="h-[400px] md:h-[500px] w-full rounded-xl" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
                <div className="md:col-span-2 space-y-4 md:space-y-6">
                    <Skeleton className="h-6 md:h-8 w-1/3" />
                    <Skeleton className="h-24 md:h-32 w-full" />
                    <div className="grid grid-cols-2 gap-4">
                        <Skeleton className="h-20 md:h-24 w-full" />
                        <Skeleton className="h-20 md:h-24 w-full" />
                    </div>
                </div>
            </div>
        </div>
    );

    if (error || !movie) return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 md:p-10 pb-20 md:pb-10">
            <Alert variant="destructive" className="glass-card animate-fade-in">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error || 'Movie not found.'}</AlertDescription>
            </Alert>
        </div>
    );

    // Helper to find Indian Streaming Links
    const getStreaming = () => {
        const providers = movie['watch/providers']?.results?.IN;
        const link = providers?.link;
        const name = providers?.flatrate?.[0]?.provider_name || providers?.buy?.[0]?.provider_name || providers?.rent?.[0]?.provider_name;
        return link && name ? { name, link } : null;
    };

    const streamInfo = getStreaming();

    const handleAddToCompare = () => {
        if (!movie || !canAddMore || isInComparison(movie.id)) {
            return;
        }

        setIsAddingToCompare(true);
        
        const comparisonMovie = {
            id: movie.id,
            title: movie.title,
            poster_path: movie.poster_path,
            vote_average: movie.vote_average,
            release_date: movie.release_date,
            overview: movie.overview || '',
            runtime: movie.runtime || 0,
            genres: movie.genres || [],
            budget: movie.budget || 0,
            revenue: movie.revenue || 0,
            backdrop_path: movie.backdrop_path,
        };

        addToCompare(comparisonMovie);
        setIsAddingToCompare(false);
    };

    const inComparison = movie ? isInComparison(movie.id) : false;
    const disabled = !canAddMore && !inComparison;

    return (
        <div className="min-h-screen bg-background text-foreground font-sans pb-20 md:pb-10">

            {/* 1. Hero Section (Backdrop) */}
            <div
                className="relative h-[50vh] md:h-[60vh] w-full bg-cover bg-center bg-background"
                style={movie.backdrop_path ? { backgroundImage: `url(https://image.tmdb.org/t/p/original${movie.backdrop_path})` } : {}}
            >
                {/* Gradient Overlay fading to theme background */}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent"></div>

                {/* Back Button */}
                <Button
                    size="icon"
                    variant="outline"
                    onClick={() => router.back()}
                    className="absolute top-4 left-4 md:top-6 md:left-6 z-10 glass-card border-none rounded-full transition-smooth hover-scale"
                >
                    <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
                </Button>

                {/* Title & Stats Overlay */}
                <div className="absolute bottom-6 md:bottom-10 left-4 md:left-6 lg:left-12 max-w-4xl animate-fade-in">
                    <h1 className="text-2xl md:text-4xl lg:text-6xl font-bold text-foreground drop-shadow-lg mb-3 md:mb-4">{movie.title}</h1>
                    <div className="flex flex-wrap gap-2 md:gap-4 text-xs md:text-sm lg:text-lg font-medium text-muted-foreground items-center">
                        {/* OMDb Maturity Rating */}
                        {omdb?.Rated && omdb.Rated !== 'N/A' && (
                            <Badge variant="secondary" className="border-border text-xs">
                                {omdb.Rated}
                            </Badge>
                        )}
                        <Badge variant="destructive" className="text-xs">
                            {movie.status}
                        </Badge>
                        <span>{movie.release_date.split('-')[0]}</span>
                        <span>{movie.runtime} min</span>
                        <span className="flex items-center gap-1 text-yellow-500 font-bold">
                            <Star className="fill-current w-4 h-4 md:w-5 md:h-5" /> {omdb?.imdbRating || movie.vote_average.toFixed(1)}/10
                        </span>
                    </div>
                </div>
            </div>

            {/* 2. Main Content Grid */}
            <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12">

                {/* Left Column: Poster & Financials */}
                <div className="md:col-span-1 space-y-4 md:space-y-8 animate-slide-up">
                    <div className="rounded-xl overflow-hidden shadow-2xl border border-border glass-card">
                        <AspectRatio ratio={2/3}>
                            <img
                                src={`https://image.tmdb.org/t/p/w780${movie.poster_path}`}
                                alt={movie.title}
                                className="w-full h-full object-cover transition-smooth"
                            />
                        </AspectRatio>
                    </div>

                    {/* Box Office Card */}
                    <Card className="glass-card animate-scale-in" style={{ animationDelay: '100ms' }}>
                        <CardHeader>
                            <CardTitle className="text-base md:text-lg">Financials</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 md:space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground text-sm md:text-base">Box Office</span>
                                <span className="font-bold text-primary text-sm md:text-base">{omdb?.BoxOffice !== 'N/A' ? omdb?.BoxOffice : 'N/A'}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground text-sm md:text-base">Budget</span>
                                <span className="text-sm md:text-base">{movie.budget > 0 ? `$${(movie.budget / 1000000).toFixed(1)}M` : 'N/A'}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground text-sm md:text-base">Revenue</span>
                                <span className="text-sm md:text-base">{movie.revenue > 0 ? `$${(movie.revenue / 1000000).toFixed(1)}M` : 'N/A'}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Compare Button */}
                    <Button
                        onClick={handleAddToCompare}
                        disabled={disabled || inComparison || isAddingToCompare}
                        variant={inComparison ? "default" : "outline"}
                        className="w-full h-11 md:h-12 text-base md:text-lg shadow-sm glass-card transition-smooth"
                        style={{ animationDelay: '200ms' }}
                    >
                        {isAddingToCompare ? (
                            <>
                                <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                                Adding...
                            </>
                        ) : inComparison ? (
                            <>
                                <Check className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                                Added to Comparison
                            </>
                        ) : (
                            <>
                                <Scale className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                                Add to Compare
                            </>
                        )}
                    </Button>

                    {/* Watchlist Button */}
                    {movie && (
                        <div style={{ animationDelay: '300ms' }} className="animate-scale-in">
                            <WatchlistButton
                                movieId={movie.id}
                                movieTitle={movie.title}
                                variant="outline"
                                className="w-full h-11 md:h-12 text-base md:text-lg shadow-sm glass-card"
                            />
                        </div>
                    )}

                    {/* Mark as Watched Button */}
                    {movie && (
                        <div style={{ animationDelay: '350ms' }} className="animate-scale-in">
                            <MarkWatchedButton
                                movieId={movie.id}
                                movieTitle={movie.title}
                                variant="outline"
                                className="w-full h-11 md:h-12 text-base md:text-lg shadow-sm glass-card"
                                onSave={fetchUserRating}
                            />
                        </div>
                    )}

                    {/* User Rating Display */}
                    {user && userRating && (
                        <Card className="glass-card animate-scale-in" style={{ animationDelay: '400ms' }}>
                            <CardContent className="p-4 md:p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm md:text-base font-semibold">Your Rating</h3>
                                    <RatingButton
                                        movieId={movie.id}
                                        movieTitle={movie.title}
                                        size="sm"
                                        variant="ghost"
                                        onSave={fetchUserRating}
                                    />
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                                            <Star
                                                key={value}
                                                className={`h-4 w-4 md:h-5 md:w-5 ${
                                                    value <= userRating.rating
                                                        ? 'text-yellow-500 fill-current'
                                                        : 'text-muted-foreground'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-lg md:text-xl font-bold">{userRating.rating}/10</span>
                                </div>
                                {userRating.body && (
                                    <p className="text-sm md:text-base text-muted-foreground mt-2 line-clamp-3">
                                        {userRating.body}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Streaming Button */}
                    {streamInfo ? (
                        <Button
                            asChild
                            variant="default"
                            className="w-full h-11 md:h-12 text-base md:text-lg shadow-sm glass-card transition-smooth"
                            style={{ animationDelay: '400ms' }}
                        >
                            <a
                                href={streamInfo.link}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-center gap-2"
                            >
                                <Tv className="w-5 h-5 md:w-6 md:h-6" /> Watch on {streamInfo.name}
                            </a>
                        </Button>
                    ) : (
                        <Alert className="text-center justify-center glass-card animate-scale-in" style={{ animationDelay: '400ms' }}>
                            <AlertDescription>Streaming Unavailable</AlertDescription>
                        </Alert>
                    )}
                </div>

                {/* Reviews Section */}
                {movie && (
                    <div className="md:col-span-3 animate-fade-in" style={{ animationDelay: '500ms' }}>
                        <ReviewsSection movieId={movie.id} movieTitle={movie.title} />
                    </div>
                )}

                {/* Right Column: Detailed Info */}
                <div className="md:col-span-2 space-y-6 md:space-y-10 pt-6 md:pt-10 lg:pt-20 animate-fade-in">

                    {/* Plot */}
                    <section className="animate-slide-up">
                        <h3 className="text-xl md:text-2xl font-bold text-primary mb-3 md:mb-4 border-l-4 border-primary pl-3 md:pl-4">Plot Synopsis</h3>
                        <p className="text-base md:text-lg text-muted-foreground leading-relaxed">{omdb?.Plot !== 'N/A' ? omdb?.Plot : movie.overview}</p>
                    </section>

                    {/* Cast & Crew */}
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
                        <Card className="glass-card hover-scale">
                            <CardContent className="p-4 md:p-6">
                                <h3 className="text-lg md:text-xl font-bold mb-3 flex items-center gap-2">
                                    <Clapperboard className="text-primary w-5 h-5" /> Director
                                </h3>
                                <p className="text-base md:text-lg">{omdb?.Director || 'N/A'}</p>
                                <p className="text-xs md:text-sm text-muted-foreground mt-1">Writer: {omdb?.Writer || 'N/A'}</p>
                            </CardContent>
                        </Card>
                        <Card className="glass-card hover-scale">
                             <CardContent className="p-4 md:p-6">
                                <h3 className="text-lg md:text-xl font-bold mb-3 flex items-center gap-2">
                                    <Users className="text-primary w-5 h-5" /> Cast
                                </h3>
                                <p className="text-base md:text-lg leading-relaxed">{omdb?.Actors || 'N/A'}</p>
                            </CardContent>
                        </Card>
                    </section>

                    {/* Ratings Grid */}
                    <section className="animate-slide-up" style={{ animationDelay: '200ms' }}>
                        <h3 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Critic Ratings</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                            {/* IMDb */}
                            <Card className="glass-card text-center hover-scale transition-smooth">
                                <CardContent className="p-4 md:p-6">
                                    <span className="block text-yellow-500 text-2xl md:text-3xl font-bold mb-1">{omdb?.imdbRating || 'N/A'}</span>
                                    <span className="text-xs md:text-sm text-muted-foreground">IMDb Rating</span>
                                    <span className="block text-[10px] md:text-xs text-muted-foreground mt-1">{omdb?.imdbVotes} votes</span>
                                </CardContent>
                            </Card>

                            {/* Rotten Tomatoes */}
                            <Card className="glass-card text-center hover-scale transition-smooth">
                                <CardContent className="p-4 md:p-6">
                                    <span className="block text-destructive text-2xl md:text-3xl font-bold mb-1">
                                        {omdb?.Ratings?.find((r: any) => r.Source === 'Rotten Tomatoes')?.Value || 'N/A'}
                                    </span>
                                    <span className="text-xs md:text-sm text-muted-foreground">Rotten Tomatoes</span>
                                </CardContent>
                            </Card>

                            {/* Metascore */}
                            <Card className="glass-card text-center hover-scale transition-smooth col-span-2 md:col-span-1">
                                <CardContent className="p-4 md:p-6">
                                    <span className="block text-primary text-2xl md:text-3xl font-bold mb-1">{omdb?.Metascore !== 'N/A' ? omdb?.Metascore : '-'}</span>
                                    <span className="text-xs md:text-sm text-muted-foreground">Metascore</span>
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    {/* Awards Summary */}
                    <Card className="glass-card overflow-hidden relative border-primary/20 animate-scale-in" style={{ animationDelay: '300ms' }}>
                         {/* Decorative Background Icon */}
                        <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none">
                            <Trophy className="w-32 h-32 md:w-48 md:h-48 rotate-12" />
                        </div>
                        <CardContent className="p-6 md:p-8 flex items-start gap-4 md:gap-6 relative z-10">
                            <div className="bg-primary/10 p-3 md:p-4 rounded-full">
                                <Trophy className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-xl md:text-2xl font-bold mb-2">Awards & Recognition</h3>
                                <p className="text-base md:text-xl text-muted-foreground font-medium">
                                    {omdb?.Awards !== 'N/A' ? omdb?.Awards : 'No awards recorded.'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    
                    {/* Full Awards List */}
                    <section className="animate-slide-up" style={{ animationDelay: '400ms' }}>
                        <div className="flex items-center gap-2 mb-4">
                            <Trophy className="text-primary w-5 h-5 md:w-6 md:h-6" />
                            <h3 className="text-xl md:text-2xl font-bold">Full Awards List</h3>
                        </div>

                        {detailedAwards.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                                {detailedAwards.map((item: any, index: number) => {
                                    if (item.award) {
                                        const isWin = item.status?.toLowerCase().includes('win') || item.status?.toLowerCase().includes('won');
                                        return (
                                            <Card key={index} className="glass-card hover-scale transition-smooth animate-scale-in" style={{ animationDelay: `${index * 50}ms` }}>
                                                <CardContent className="p-3 md:p-4 flex justify-between items-center h-full">
                                                    <div className="overflow-hidden flex-1 min-w-0">
                                                        <p className="font-bold truncate text-sm md:text-base" title={item.award}>{item.award}</p>
                                                        <p className="text-xs md:text-sm text-muted-foreground truncate" title={item.category}>{item.category || ''}</p>
                                                        {item.recipient && <p className="text-[10px] md:text-xs text-muted-foreground/70 truncate">{item.recipient}</p>}
                                                    </div>
                                                    <Badge variant={isWin ? "default" : "secondary"} className="ml-2 whitespace-nowrap text-xs flex-shrink-0">
                                                        {item.status || 'Winner'}
                                                    </Badge>
                                                </CardContent>
                                            </Card>
                                        );
                                    }

                                    return (
                                        <Card key={index} className="glass-card animate-scale-in" style={{ animationDelay: `${index * 50}ms` }}>
                                            <CardContent className="p-3 md:p-4">
                                                <p className="text-xs md:text-sm text-muted-foreground">
                                                    {item.raw || item}
                                                </p>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-sm md:text-base text-muted-foreground italic">
                                {omdb?.Awards && omdb.Awards !== 'N/A'
                                    ? omdb.Awards
                                    : "Loading detailed awards or none available..."}
                            </p>
                        )}
                    </section>

                </div>
            </div>
        </div>
    );
}