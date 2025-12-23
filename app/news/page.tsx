'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Newspaper, ExternalLink, Calendar, Loader2 } from 'lucide-react';

interface Article {
  title: string;
  snippet: string;
  link: string;
  source: string;
  pubDate: string;
  image?: string;
}

export default function NewsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/news');
        
        if (!response.ok) {
          throw new Error('Failed to fetch news');
        }
        
        const data = await response.json();
        setArticles(data.articles || []);
      } catch (err) {
        console.error('Error fetching news:', err);
        setError('Failed to load news articles. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Unknown date';
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'Variety':
        return 'bg-blue-600';
      case 'Hollywood Reporter':
        return 'bg-purple-600';
      case 'CinemaBlend':
        return 'bg-green-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Newspaper className="w-8 h-8 text-red-500" />
          <h1 className="text-3xl font-bold text-red-500">Entertainment News</h1>
        </div>
        <Link
          href="/"
          className="text-gray-400 hover:text-white transition-colors"
        >
          ← Back to Movies
        </Link>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-red-500 animate-spin" />
            <p className="text-gray-400">Loading news articles...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-900/30 border border-red-500 rounded-lg p-6 text-center">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Articles Grid */}
      {!loading && !error && (
        <>
          {articles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article, index) => (
                <article
                  key={`${article.link}-${index}`}
                  className="bg-gray-800 rounded-xl overflow-hidden hover:scale-105 transition-transform duration-200 shadow-lg group"
                >
                  {/* Article Image (if available) */}
                  {article.image && (
                    <div className="relative aspect-video overflow-hidden">
                      <img
                        src={article.image}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          // Hide image if it fails to load
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {/* Article Content */}
                  <div className="p-6 flex flex-col h-full">
                    {/* Source Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`${getSourceColor(article.source)} text-white text-xs font-semibold px-3 py-1 rounded-full`}
                      >
                        {article.source}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Calendar className="w-3 h-3" />
                        {formatDate(article.pubDate)}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="text-xl font-bold mb-3 line-clamp-2 group-hover:text-red-500 transition-colors">
                      <a
                        href={article.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {article.title}
                      </a>
                    </h2>

                    {/* Snippet */}
                    <p className="text-gray-300 text-sm mb-4 line-clamp-3 flex-grow">
                      {article.snippet}
                    </p>

                    {/* Read More Button */}
                    <a
                      href={article.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors mt-auto"
                    >
                      Read More
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 mt-10">
              <p>No news articles available at this time.</p>
            </div>
          )}
        </>
      )}

      {/* Footer Note */}
      {!loading && articles.length > 0 && (
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Articles are aggregated from various entertainment news sources.
            Click "Read More" to view the full article on the original website.
          </p>
        </div>
      )}
    </div>
  );
}

