/**
 * Theme Registry
 * Maps specific movie IDs to their theme names
 */

export type ThemeName = 'retro-dark';

export const MOVIE_THEMES: Record<number, ThemeName> = {
  // No movie-specific themes - users select themes manually
};

/**
 * Get theme name for a movie ID
 * @param movieId - The TMDB movie ID
 * @returns Theme name if movie has a theme, null otherwise
 */
export function getThemeForMovie(movieId: number | string | null | undefined): ThemeName | null {
  // No movie-specific themes
  return null;
}

/**
 * Get CSS class name for a theme
 * @param theme - Theme name
 * @returns CSS class name (e.g., 'retro-dark')
 */
export function getThemeClass(theme: ThemeName | null): string {
  if (!theme) return '';
  
  const classMap: Record<ThemeName, string> = {
    'retro-dark': 'retro-dark',
  };
  
  return classMap[theme];
}

