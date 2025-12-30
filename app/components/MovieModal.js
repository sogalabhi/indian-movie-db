'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Star, Trophy, Clock, DollarSign, Tv } from 'lucide-react';

export default function MovieModal({ movie, onClose }) {
  const [details, setDetails] = useState(null);
  const [omdbData, setOmdbData] = useState(null);
  const [loading, setLoading] = useState(true);

  // API Keys
  const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
  const OMDB_API_KEY = process.env.NEXT_PUBLIC_OMDB_API_KEY;

  useEffect(() => {
    const fetchDetails = async () => {
      if (!movie) return;
      setLoading(true);

      try {
        // 1. Fetch TMDB Details (External IDs + Watch Providers)
        const tmdbRes = await axios.get(
          `https://api.themoviedb.org/3/movie/${movie.id}`,
          {
            params: {
              api_key: TMDB_API_KEY,
              append_to_response: 'external_ids,watch/providers',
            },
          }
        );
        setDetails(tmdbRes.data);

        // 2. Fetch OMDb Data (Ratings & Awards) using the IMDb ID found in step 1
        const imdbId = tmdbRes.data.external_ids?.imdb_id;
        if (imdbId) {
          const omdbRes = await axios.get(`https://www.omdbapi.com/`, {
            params: {
              apikey: OMDB_API_KEY,
              i: imdbId,
            },
          });
          setOmdbData(omdbRes.data);
        }
      } catch (error) {
        console.error('Error fetching details:', error);
      }
      setLoading(false);
    };

    fetchDetails();
  }, [movie]);

  if (!movie) return null;

  // Helper to get Rotten Tomatoes score
  const getRottenTomatoes = () => {
    const rt = omdbData?.Ratings?.find((r) => r.Source === 'Rotten Tomatoes');
    return rt ? rt.Value : 'N/A';
  };

  // Helper to get Streaming Provider (India)
  const getStreaming = () => {
    const providers = details?.['watch/providers']?.results?.IN;
    if (!providers) return null;
    return providers.flatrate?.[0]?.provider_name || providers.buy?.[0]?.provider_name;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-card w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl border border-border max-h-[90vh] overflow-y-auto glass-card">
        
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full hover:bg-red-600 transition">
          <X className="w-6 h-6 text-white" />
        </button>

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row">
            {/* Left: Poster */}
            <div className="w-full md:w-1/3 relative">
              <img 
                src={movie.poster_path ? `https://image.tmdb.org/t/p/w780${movie.poster_path}` : 'https://via.placeholder.com/500x750'} 
                alt={movie.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Right: Details */}
            <div className="w-full md:w-2/3 p-6 md:p-8 text-white">
              <h2 className="text-3xl font-bold mb-2">{movie.title}</h2>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
                <span className="border border-border px-2 py-1 rounded">{details?.release_date?.split('-')[0]}</span>
                <span className="border border-border px-2 py-1 rounded">{details?.runtime} min</span>
                <span className="text-red-400 font-semibold">{details?.genres?.map(g => g.name).join(', ')}</span>
              </div>

              {/* Comparison Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                {/* IMDb */}
                <div className="bg-muted p-4 rounded-xl border border-border glass-card">
                  <div className="flex items-center gap-2 text-yellow-400 mb-1">
                    <Star className="fill-current w-5 h-5" />
                    <span className="font-bold text-xl">{omdbData?.imdbRating || 'N/A'}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">IMDb Rating</p>
                </div>

                {/* Rotten Tomatoes */}
                <div className="bg-muted p-4 rounded-xl border border-border glass-card">
                  <div className="flex items-center gap-2 text-red-500 mb-1">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/5/5b/Rotten_Tomatoes.svg" className="w-5 h-5" alt="RT" />
                    <span className="font-bold text-xl">{getRottenTomatoes()}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Rotten Tomatoes</p>
                </div>

                {/* Budget/Box Office (From OMDb or TMDB) */}
                <div className="bg-muted p-4 rounded-xl border border-border glass-card">
                  <div className="flex items-center gap-2 text-green-400 mb-1">
                    <DollarSign className="w-5 h-5" />
                    <span className="font-bold text-lg">{omdbData?.BoxOffice !== 'N/A' ? omdbData?.BoxOffice : 'N/A'}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Box Office (Intl)</p>
                </div>

                {/* Awards */}
                <div className="bg-muted p-4 rounded-xl border border-border glass-card">
                  <div className="flex items-center gap-2 text-purple-400 mb-1">
                    <Trophy className="w-5 h-5" />
                    <span className="font-bold text-sm truncate w-full">{omdbData?.Awards !== 'N/A' ? 'Winner' : 'None'}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{omdbData?.Awards}</p>
                </div>
              </div>

              {/* Plot */}
              <p className="text-foreground mb-6 leading-relaxed">{details?.overview}</p>

              {/* Streaming Section */}
              <div className="border-t border-border pt-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                   <Tv className="w-5 h-5 text-blue-400" /> Where to Watch
                </h3>
                {getStreaming() ? (
                  <a 
                    href={details?.homepage} 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition"
                  >
                    Watch on {getStreaming()}
                  </a>
                ) : (
                  <p className="text-muted-foreground">Streaming information not available for this region.</p>
                )}
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}