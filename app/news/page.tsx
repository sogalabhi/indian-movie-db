'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Newspaper, ExternalLink, Calendar, AlertCircle } from 'lucide-react';

// Shadcn UI Imports
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AspectRatio } from '@/components/ui/aspect-ratio';

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

  // Helper to map sources to standard Badge variants if needed
  // Since Shadcn badges rely on variants like "default", "secondary", "destructive", "outline"
  // We can stick to "secondary" or "outline" for neutral sources, or generic color classes if strict theming isn't required for specific brands.
  const getBadgeVariant = (source: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (source) {
      case 'Variety':
        return 'default'; // Primary brand color
      case 'Hollywood Reporter':
        return 'secondary';
      case 'CinemaBlend':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    // CHANGE 1: Standard Background
    <div className="min-h-screen bg-background text-foreground p-8">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          {/* CHANGE 2: Semantic Colors */}
          <Newspaper className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-primary">Entertainment News</h1>
        </div>
        
        {/* CHANGE 3: Button component for Link */}
        <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
            <Link href="/">
            ← Back to Movies
            </Link>
        </Button>
      </div>

      {/* Loading State (Skeleton) */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden h-full">
              <AspectRatio ratio={16 / 9}>
                <Skeleton className="w-full h-full" />
              </AspectRatio>
              <CardContent className="p-6 space-y-4">
                 <div className="flex justify-between">
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                 </div>
                 <Skeleton className="h-6 w-full" />
                 <Skeleton className="h-4 w-full" />
                 <Skeleton className="h-4 w-2/3" />
                 <Skeleton className="h-10 w-32 mt-auto" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error State (Alert) */}
      {error && !loading && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Articles Grid */}
      {!loading && !error && (
        <>
          {articles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article, index) => (
                <Card
                  key={`${article.link}-${index}`}
                  className="overflow-hidden hover:scale-105 transition-transform duration-200 shadow-lg group flex flex-col h-full"
                >
                  {/* Article Image (AspectRatio) */}
                  {article.image && (
                    <div className="relative">
                        <AspectRatio ratio={16 / 9}>
                            <img
                                src={article.image}
                                alt={article.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                }}
                            />
                        </AspectRatio>
                    </div>
                  )}

                  {/* Article Content */}
                  <CardContent className="p-6 flex flex-col flex-grow">
                    {/* Source Badge */}
                    <div className="flex items-center justify-between mb-3">
                      {/* CHANGE 4: Shadcn Badge */}
                      <Badge variant={getBadgeVariant(article.source)}>
                        {article.source}
                      </Badge>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {formatDate(article.pubDate)}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="text-xl font-bold mb-3 line-clamp-2 group-hover:text-primary transition-colors">
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
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-3 flex-grow">
                      {article.snippet}
                    </p>

                    {/* Read More Button */}
                    <Button
                      asChild
                      className="mt-auto w-fit"
                    >
                      <a
                        href={article.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2"
                      >
                        Read More
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center mt-10">
              <Alert>
                <AlertDescription className="text-muted-foreground">
                    No news articles available at this time.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </>
      )}

      {/* Footer Note */}
      {!loading && articles.length > 0 && (
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Articles are aggregated from various entertainment news sources.
            Click "Read More" to view the full article on the original website.
          </p>
        </div>
      )}
    </div>
  );
}