import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import axios from 'axios';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imdbId = searchParams.get('imdbId');

  if (!imdbId) {
    return NextResponse.json({ error: 'IMDb ID is required' }, { status: 400 });
  }

  try {
    // 1. Fetch the IMDb Awards Page HTML
    const url = `https://www.imdb.com/title/${imdbId}/awards/`;
    
    // We must use a User-Agent to look like a real browser, or IMDb will block us.
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    // 2. Load HTML into Cheerio
    const $ = cheerio.load(data);
    const awardsList: any[] = [];

    // 3. Scrape the specific elements (This structure depends on IMDb's current layout)
    // Note: IMDb changes class names often. We target semantic sections where possible.
    
    // Strategy: Look for the "Award" headers and the rows below them
    $('.ipc-metadata-list-summary-item').each((i, el) => {
      try {
        const awardName = $(el).find('.ipc-metadata-list-summary-item__t').text().trim();
        const category = $(el).find('.ipc-metadata-list-summary-item__li').first().text().trim();
        const recipient = $(el).find('.ipc-metadata-list-summary-item__li').eq(1).text().trim(); // Often the person's name
        const status = $(el).find('.ipc-metadata-list-summary-item__tl').text().trim() || 'Winner'; // Usually "Winner" or "Nominee"

        if (awardName) {
           awardsList.push({
             award: awardName,
             category: category,
             recipient: recipient,
             status: status
           });
        }
      } catch (e) {
        // Skip errors in individual items
      }
    });

    // Fallback: If the new layout scraping fails, try the old layout (IMDb serves different versions)
    if (awardsList.length === 0) {
        $('.award_description').each((i, el) => {
            const text = $(el).text().replace(/\s\s+/g, ' ').trim();
            awardsList.push({ raw: text });
        });
    }

    return NextResponse.json({ awards: awardsList });

  } catch (error) {
    console.error('Scraping Error:', error);
    return NextResponse.json({ error: 'Failed to fetch awards' }, { status: 500 });
  }
}