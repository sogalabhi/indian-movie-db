import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import axios from 'axios';

const parser = new Parser();

interface Article {
  title: string;
  snippet: string;
  link: string;
  source: string;
  pubDate: string;
  image?: string;
}

// RSS Feed URLs
const RSS_FEEDS = [
  { url: 'https://timesofindia.indiatimes.com/rssfeeds/1081479906.cms', name: 'Times of India' },
  { url: 'https://www.hollywoodreporter.com/feed/', name: 'Hollywood Reporter' },
  { url: 'https://www.cinemablend.com/rss/topic/news/movies', name: 'CinemaBlend' },
  {url : 'https://www.bollywoodhungama.com/rss/movie-review.xml', name: 'Bollywood Hungama'},
  {url : 'https://www.bollywoodhungama.com/rss/news.xml', name: 'Bollywood Hungama'},
  { url: 'https://www.pinkvilla.com/rss.xml', name: 'Pinkvilla' },
  { url: 'https://www.filmfare.com/rss/news.xml', name: 'Filmfare' },
  { url: 'https://www.koimoi.com/feed/', name: 'Koimoi' },
];

// Extract first 1-2 sentences from content
function extractSnippet(content: string, maxLength: number = 200): string {
  if (!content) return '';
  
  // Remove HTML tags
  const text = content.replace(/<[^>]*>/g, '').trim();
  
  // Try to find sentence boundaries
  const sentences = text.match(/[^.!?]+[.!?]+/g);
  
  if (sentences && sentences.length > 0) {
    // Take first 1-2 sentences, but limit total length
    let snippet = sentences[0];
    if (sentences.length > 1 && snippet.length + sentences[1].length <= maxLength) {
      snippet += ' ' + sentences[1];
    }
    return snippet.trim();
  }
  
  // Fallback: truncate to maxLength
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

async function fetchFeed(feedUrl: string, sourceName: string): Promise<Article[]> {
  try {
    // Fetch the RSS feed
    const response = await axios.get(feedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
      timeout: 10000, // 10 second timeout
    });

    // Parse the RSS feed
    const feed = await parser.parseString(response.data);
    const articles: Article[] = [];

    if (feed.items) {
      feed.items.forEach((item) => {
        const snippet = extractSnippet(item.contentSnippet || item.content || item.description || '');
        
        articles.push({
          title: item.title || 'Untitled',
          snippet: snippet,
          link: item.link || '',
          source: sourceName,
          pubDate: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
          image: item.enclosure?.url || item['media:content']?.['$']?.url || undefined,
        });
      });
    }

    return articles;
  } catch (error) {
    console.error(`Error fetching feed from ${sourceName}:`, error);
    return []; // Return empty array if feed fails
  }
}

export async function GET() {
  try {
    // Fetch all feeds in parallel
    const feedPromises = RSS_FEEDS.map((feed) => fetchFeed(feed.url, feed.name));
    const feedResults = await Promise.all(feedPromises);

    // Combine all articles
    const allArticles: Article[] = feedResults.flat();

    // Sort by publication date (newest first)
    allArticles.sort((a, b) => {
      const dateA = new Date(a.pubDate).getTime();
      const dateB = new Date(b.pubDate).getTime();
      return dateB - dateA;
    });

    return NextResponse.json({ articles: allArticles });
  } catch (error) {
    console.error('Error in news API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news articles' },
      { status: 500 }
    );
  }
}

