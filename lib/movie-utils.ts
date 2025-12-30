import axios from 'axios';

/**
 * Fetch detailed awards from IMDb for a given IMDb ID
 * @param imdbId - The IMDb ID (e.g., "tt1234567")
 * @param timeout - Request timeout in milliseconds (default: 10000)
 * @returns Promise with awards array or empty array on error
 */
export async function fetchImdbAwards(
  imdbId: string,
  timeout: number = 10000
): Promise<any[]> {
  if (!imdbId) {
    return [];
  }

  try {
    const response = await axios.get(`/api/awards?imdbId=${imdbId}`, { timeout });
    return response.data.awards || [];
  } catch (error) {
    console.error(`Error fetching awards for IMDb ID ${imdbId}:`, error);
    return [];
  }
}

/**
 * Fetch awards for multiple movies
 * @param movies - Array of objects with movieId and imdbId
 * @param timeout - Request timeout in milliseconds (default: 10000)
 * @returns Promise with a map of movieId to awards array
 */
export async function fetchMultipleImdbAwards(
  movies: Array<{ movieId: number; imdbId: string }>,
  timeout: number = 10000
): Promise<Record<number, any[]>> {
  if (movies.length === 0) {
    return {};
  }

  try {
    const awardsPromises = movies.map(async ({ movieId, imdbId }, index) => {
      // Add delay between requests to avoid rate limiting
      if (index > 0) {
        await new Promise((resolve) => setTimeout(resolve, index * 200));
      }
      
      const awards = await fetchImdbAwards(imdbId, timeout);
      return { movieId, awards };
    });

    const awardsResponses = await Promise.all(awardsPromises);
    const awardsMap: Record<number, any[]> = {};
    
    awardsResponses.forEach(({ movieId, awards }) => {
      if (awards && awards.length > 0) {
        awardsMap[movieId] = awards;
      }
    });

    return awardsMap;
  } catch (error) {
    console.error('Error fetching multiple awards:', error);
    return {};
  }
}

