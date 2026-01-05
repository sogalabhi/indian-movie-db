/**
 * Theme Registry
 * Maps specific movie IDs to their theme names
 */

export type ThemeName = 'toxic' | 'ramayana' | 'varanasi';

export const MOVIE_THEMES: Record<number, ThemeName> = {
  1213243: 'toxic',      // TOXIC
  656908: 'ramayana',   // Ramayana
  920708: 'varanasi',   // Varanasi
};

/**
 * Get theme name for a movie ID
 * @param movieId - The TMDB movie ID
 * @returns Theme name if movie has a theme, null otherwise
 */
export function getThemeForMovie(movieId: number | string | null | undefined): ThemeName | null {
  if (!movieId) return null;
  const id = typeof movieId === 'string' ? parseInt(movieId, 10) : movieId;
  if (isNaN(id)) return null;
  return MOVIE_THEMES[id] || null;
}

/**
 * Get CSS class name for a theme
 * @param theme - Theme name
 * @returns CSS class name (e.g., 'toxic-theme', 'rama-theme', 'varanasi-theme')
 */
export function getThemeClass(theme: ThemeName | null): string {
  if (!theme) return '';
  
  const classMap: Record<ThemeName, string> = {
    toxic: 'toxic-theme',
    ramayana: 'rama-theme',
    varanasi: 'varanasi-theme',
  };
  
  return classMap[theme];
}

