'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import { Star, Trophy, ArrowLeft, Tv, Users, Clapperboard, Scale, Check } from 'lucide-react';
import { useComparison } from '../../contexts/ComparisonContext';

export default function MovieDetail() {
    const { id } = useParams(); // Get the movie ID from the URL (e.g., /movie/123)
    const router = useRouter();
    const { addToCompare, isInComparison, canAddMore } = useComparison();

    const [movie, setMovie] = useState<any>(null);
    const [omdb, setOmdb] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [detailedAwards, setDetailedAwards] = useState([]);
    const [isAddingToCompare, setIsAddingToCompare] = useState(false);
    // API Keys
    const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
    const OMDB_API_KEY = process.env.NEXT_PUBLIC_OMDB_API_KEY;

    useEffect(() => {
        if (omdb?.imdbID) {
            // Call our custom scraper
            axios.get(`/api/awards?imdbId=${omdb.imdbID}`)
                .then(res => setDetailedAwards(res.data.awards))
                .catch(err => console.error(err));
        }
    }, [omdb]);

    useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Fetch Basic Info from TMDB
                const tmdbRes = await axios.get(
                    `https://api.themoviedb.org/3/movie/${id}`,
                    {
                        params: {
                            api_key: TMDB_API_KEY,
                            append_to_response: 'external_ids,watch/providers', // Get IMDb ID, Streaming
                        },
                    }
                );
                const tmdbData = tmdbRes.data;
                setMovie(tmdbData);

                // 2. Fetch Ratings & Awards from OMDb using IMDb ID
                if (tmdbData.external_ids?.imdb_id) {
                    const omdbRes = await axios.get(`https://www.omdbapi.com/`, {
                        params: {
                            apikey: OMDB_API_KEY,
                            i: tmdbData.external_ids.imdb_id,
                            plot: 'full'
                        },
                    });
                    setOmdb(omdbRes.data);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
            setLoading(false);
        };

        fetchData();
    }, [id, TMDB_API_KEY, OMDB_API_KEY]);

    if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading Movie Details...</div>;
    if (!movie) return <div className="min-h-screen bg-gray-900 text-white p-10">Movie not found.</div>;

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
        
        // Convert movie to ComparisonMovie format
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
        <div className="min-h-screen bg-gray-900 text-gray-100 font-sans pb-10">

            {/* 1. Hero Section (Backdrop) */}
            <div
                className="relative h-[60vh] w-full bg-cover bg-center"
                style={{ backgroundImage: `url(https://image.tmdb.org/t/p/original${movie.backdrop_path})` }}
            >
                {/* Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent"></div>

                {/* Back Button */}
                <button
                    onClick={() => router.back()}
                    className="absolute top-6 left-6 z-10 bg-black/50 p-3 rounded-full hover:bg-red-600 transition"
                >
                    <ArrowLeft className="w-6 h-6 text-white" />
                </button>

                {/* Title & Stats Overlay */}
                <div className="absolute bottom-10 left-6 md:left-12 max-w-4xl">
                    <h1 className="text-4xl md:text-6xl font-bold text-white drop-shadow-lg mb-4">{movie.title}</h1>
                    <div className="flex flex-wrap gap-4 text-sm md:text-lg font-medium text-gray-200 items-center">
                        {/* OMDb Maturity Rating */}
                        {omdb?.Rated && omdb.Rated !== 'N/A' && (
                            <span className="bg-gray-700 border border-gray-500 px-2 py-1 rounded text-xs">{omdb.Rated}</span>
                        )}
                        <span className="bg-red-600 px-3 py-1 rounded-md text-sm">{movie.status}</span>
                        <span>{movie.release_date.split('-')[0]}</span>
                        <span>{movie.runtime} min</span>
                        <span className="flex items-center gap-1 text-yellow-400 font-bold">
                            <Star className="fill-current w-5 h-5" /> {omdb?.imdbRating || movie.vote_average.toFixed(1)}/10
                        </span>
                    </div>
                </div>
            </div>

            {/* 2. Main Content Grid */}
            <div className="max-w-7xl mx-auto px-6 relative z-10 grid grid-cols-1 md:grid-cols-3 gap-12">

                {/* Left Column: Poster & Financials */}
                <div className="md:col-span-1 space-y-8">
                    <img
                        src={`https://image.tmdb.org/t/p/w780${movie.poster_path}`}
                        alt={movie.title}
                        className="w-full rounded-xl shadow-2xl border-4 border-gray-800"
                    />

                    {/* Box Office Card */}
                    <div className="bg-gray-800 rounded-xl p-6 space-y-4 border border-gray-700 shadow-lg">
                        <div className="flex justify-between border-b border-gray-700 pb-2">
                            <span className="text-gray-400">Box Office</span>
                            <span className="text-green-400 font-bold">{omdb?.BoxOffice !== 'N/A' ? omdb?.BoxOffice : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-700 pb-2">
                            <span className="text-gray-400">Budget</span>
                            <span className="text-white">{movie.budget > 0 ? `$${(movie.budget / 1000000).toFixed(1)}M` : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Revenue</span>
                            <span className="text-white">{movie.revenue > 0 ? `$${(movie.revenue / 1000000).toFixed(1)}M` : 'N/A'}</span>
                        </div>
                    </div>

                    {/* Compare Button */}
                    <button
                        onClick={handleAddToCompare}
                        disabled={disabled || inComparison || isAddingToCompare}
                        className={`
                            flex items-center justify-center gap-2 w-full
                            ${inComparison 
                                ? 'bg-green-600 hover:bg-green-700' 
                                : disabled 
                                ? 'bg-gray-600 cursor-not-allowed opacity-50' 
                                : 'bg-red-600 hover:bg-red-700'
                            }
                            text-white font-bold py-4 rounded-xl transition shadow-lg
                            disabled:cursor-not-allowed
                        `}
                        title={
                            inComparison 
                                ? 'Already in comparison' 
                                : disabled 
                                ? 'Maximum 4 movies allowed' 
                                : 'Add to comparison'
                        }
                    >
                        {isAddingToCompare ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Adding...
                            </>
                        ) : inComparison ? (
                            <>
                                <Check className="w-5 h-5" />
                                Added to Comparison
                            </>
                        ) : (
                            <>
                                <Scale className="w-5 h-5" />
                                Add to Compare
                            </>
                        )}
                    </button>

                    {/* Streaming Button */}
                    {streamInfo ? (
                        <a
                            href={streamInfo.link}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition shadow-lg hover:shadow-blue-500/30"
                        >
                            <Tv className="w-6 h-6" /> Watch on {streamInfo.name}
                        </a>
                    ) : (
                        <div className="bg-gray-800 border border-gray-700 text-gray-500 text-center py-4 rounded-xl">Streaming Unavailable</div>
                    )}
                </div>

                {/* Right Column: Detailed Info */}
                <div className="md:col-span-2 space-y-10 pt-10 md:pt-20">

                    {/* Plot */}
                    <section>
                        <h3 className="text-2xl font-bold text-red-500 mb-4 border-l-4 border-red-500 pl-4">Plot Synopsis</h3>
                        <p className="text-lg text-gray-300 leading-relaxed">{omdb?.Plot !== 'N/A' ? omdb?.Plot : movie.overview}</p>
                    </section>

                    {/* Cast & Crew */}
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                            <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2"><Clapperboard className="text-red-500" /> Director</h3>
                            <p className="text-gray-300 text-lg">{omdb?.Director || 'N/A'}</p>
                            <p className="text-sm text-gray-500 mt-1">Writer: {omdb?.Writer || 'N/A'}</p>
                        </div>
                        <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                            <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2"><Users className="text-red-500" /> Cast</h3>
                            <p className="text-gray-300 text-lg leading-relaxed">{omdb?.Actors || 'N/A'}</p>
                        </div>
                    </section>

                    {/* Ratings Grid */}
                    <section>
                        <h3 className="text-2xl font-bold text-white mb-6">Critic Ratings</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {/* IMDb */}
                            <div className="bg-gray-800 p-5 rounded-lg border border-gray-700 text-center transform hover:-translate-y-1 transition">
                                <span className="block text-yellow-500 text-3xl font-bold mb-1">{omdb?.imdbRating || 'N/A'}</span>
                                <span className="text-sm text-gray-400">IMDb Rating</span>
                                <span className="block text-xs text-gray-500 mt-1">{omdb?.imdbVotes} votes</span>
                            </div>

                            {/* Rotten Tomatoes */}
                            <div className="bg-gray-800 p-5 rounded-lg border border-gray-700 text-center transform hover:-translate-y-1 transition">
                                <span className="block text-red-500 text-3xl font-bold mb-1">
                                    {omdb?.Ratings?.find((r: any) => r.Source === 'Rotten Tomatoes')?.Value || 'N/A'}
                                </span>
                                <span className="text-sm text-gray-400">Rotten Tomatoes</span>
                            </div>

                            {/* Metascore */}
                            <div className="bg-gray-800 p-5 rounded-lg border border-gray-700 text-center transform hover:-translate-y-1 transition">
                                <span className="block text-green-500 text-3xl font-bold mb-1">{omdb?.Metascore !== 'N/A' ? omdb?.Metascore : '-'}</span>
                                <span className="text-sm text-gray-400">Metascore</span>
                            </div>
                        </div>
                    </section>

                    {/* Awards Section (Completed) */}
                    <section className="bg-gradient-to-r from-gray-800 to-gray-900 p-8 rounded-xl border border-gray-700 relative overflow-hidden">
                        <div className="relative z-10 flex items-start gap-6">
                            <div className="bg-yellow-500/20 p-4 rounded-full">
                                <Trophy className="w-10 h-10 text-yellow-500" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2">Awards & Recognition</h3>
                                <p className="text-xl text-gray-300 font-medium">
                                    {omdb?.Awards !== 'N/A' ? omdb?.Awards : 'No awards recorded.'}
                                </p>
                            </div>
                        </div>
                        {/* Decorative Background Icon */}
                        <Trophy className="absolute -right-6 -bottom-6 w-48 h-48 text-gray-700/20 rotate-12" />
                    </section>
                    {/* Awards Section */}
                    <section className="bg-gray-800 p-6 rounded-xl border border-gray-700 mt-8">
                        <div className="flex items-center gap-2 mb-4">
                            <Trophy className="text-yellow-500 w-6 h-6" />
                            <h3 className="text-2xl font-bold text-white">Full Awards List</h3>
                        </div>

                        {detailedAwards.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {detailedAwards.map((item: any, index: number) => {
                                    // CASE 1: We got clean structured data
                                    if (item.award) {
                                        const isWin = item.status?.toLowerCase().includes('win') || item.status?.toLowerCase().includes('won');
                                        return (
                                            <div key={index} className="bg-gray-700/50 p-3 rounded-lg border border-gray-600 flex justify-between items-center">
                                                <div className="overflow-hidden">
                                                    <p className="font-bold text-yellow-400 truncate" title={item.award}>{item.award}</p>
                                                    <p className="text-sm text-gray-300 truncate" title={item.category}>{item.category || ''}</p>
                                                    {item.recipient && <p className="text-xs text-gray-500 truncate">{item.recipient}</p>}
                                                </div>
                                                <span className={`text-xs px-2 py-1 rounded font-bold whitespace-nowrap ml-2 ${isWin ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'}`}>
                                                    {item.status || 'Winner'}
                                                </span>
                                            </div>
                                        );
                                    }

                                    // CASE 2: Fallback (Raw text data)
                                    // This runs if the scraper couldn't find specific columns but found text
                                    return (
                                        <div key={index} className="bg-gray-700/50 p-3 rounded-lg border border-gray-600">
                                            <p className="text-sm text-gray-300">
                                                {item.raw || item}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            // CASE 3: Loapi/awards/route.ts
                            <p className="text-gray-400 italic">
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
