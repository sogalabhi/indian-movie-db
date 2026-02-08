/**
 * Theme Configurations
 * Defines color palettes, fonts, typography, and assets for each theme
 */

export type ThemeConfig = {
  colors: {
    dark: {
      bg: string;
      surface: string;
      text: string;
      accent: string;
      secondary?: string;
      muted?: string;
    };
    light: {
      bg: string;
      surface: string;
      text: string;
      accent: string;
      secondary?: string;
      muted?: string;
    };
  };
  fonts: {
    heading: string;
    title: string;
    body: string;
  };
  typography: {
    headingSize: string;
    headingLetterSpacing: string;
    titleSize: string;
    bodySize: string;
    bodyLineHeight: string;
  };
  assets: {
    video?: string;
    poster?: string;
    youtube?: {
      videoId: string;
      startTime: number; // in seconds
      endTime: number; // in seconds
    };
  };
  video: {
    opacity: number;
    filters: {
      contrast?: number;
      saturate?: number;
      brightness?: number;
    };
  };
};

export const THEME_CONFIGS: Record<'retro-dark', ThemeConfig> = {
  'retro-dark': {
    colors: {
      dark: {
        bg: '#1A1F3A',           // midnight blue
        surface: '#2A1F3A',      // dark translucent surface
        text: '#F5E6D3',         // warm ivory
        accent: '#FFB84D',       // warm amber
        secondary: '#FF6B9D',    // soft pink
        muted: '#4A2C5A',        // deep purple
      },
      light: {
        bg: '#2A2F4A',
        surface: '#3A2F4A',
        text: '#2A1F20',
        accent: '#E6A84D',
        secondary: '#E65B8D',
        muted: '#5A3C6A',
      },
    },
    fonts: {
      heading: 'Inter',
      title: 'Inter',
      body: 'Inter',
    },
    typography: {
      headingSize: '2.8rem',
      headingLetterSpacing: '0.05em',
      titleSize: '1.1rem',
      bodySize: '1rem',
      bodyLineHeight: '1.6',
    },
    assets: {
      // No video assets - static background instead
    },
    video: {
      opacity: 0,
      filters: {},
    },
  },
};

/**
 * Get theme configuration
 */
export function getThemeConfig(theme: 'retro-dark' | null): ThemeConfig | null {
  if (!theme) return null;
  return THEME_CONFIGS[theme];
}

/**
 * Get video configuration by theme name (for global theme system)
 * @param theme - Theme name from next-themes (dark, light, retro-dark)
 * @returns Video config if theme has video, null otherwise
 */
export function getVideoConfigByTheme(theme: string | undefined | null): { youtube?: { videoId: string; startTime: number; endTime: number } } | null {
  // Retro Dark theme uses static background, no video
  return null;
}

