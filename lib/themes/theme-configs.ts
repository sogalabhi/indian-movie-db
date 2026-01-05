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

export const THEME_CONFIGS: Record<'toxic' | 'ramayana' | 'varanasi', ThemeConfig> = {
  toxic: {
    colors: {
      dark: {
        bg: '#0B0A08',           // deep noir black
        surface: '#15110D',       // card background
        text: '#E6D3B1',          // warm ivory
        accent: '#C9A24D',        // vintage gold
        secondary: '#D17A22',     // tungsten light (amber)
        muted: '#6E6256',         // cigar smoke
      },
      light: {
        bg: '#1A1612',
        surface: '#2A2520',
        text: '#3A2F20',
        accent: '#B8934D',
        secondary: '#C16A12',
        muted: '#5E5246',
      },
    },
    fonts: {
      heading: 'Cinzel',
      title: 'Playfair Display',
      body: 'Inter',
    },
    typography: {
      headingSize: '2.8rem',
      headingLetterSpacing: '0.08em',
      titleSize: '1.1rem',
      bodySize: '1rem',
      bodyLineHeight: '1.7',
    },
    assets: {
      youtube: {
        videoId: '0PfErHA3zzQ',
        startTime: 28, // 0:28
        endTime: 41,   // 0:41
      },
      poster: '/images/toxic-poster.jpg',
    },
    video: {
      opacity: 0.16,
      filters: {
        contrast: 1.15,
        saturate: 0.85,
        brightness: 0.75,
      },
    },
  },
  ramayana: {
    colors: {
      dark: {
        bg: '#0F1A14',           // deep forest shadow
        surface: '#16241C',      // card background
        text: '#E9E4D4',         // sacred parchment
        accent: '#CFA44A',       // divine gold
        secondary: '#4F6F52',    // foliage green
        muted: '#7A5A3A',        // soil / bark
      },
      light: {
        bg: '#1F2A24',
        surface: '#2A3A2C',
        text: '#2A2520',
        accent: '#B8943A',
        secondary: '#3F5F42',
        muted: '#6A4A2A',
      },
    },
    fonts: {
      heading: 'Tiro Devanagari Sanskrit',
      title: 'Noto Serif',
      body: 'Noto Serif',
    },
    typography: {
      headingSize: '2.6rem',
      headingLetterSpacing: '0.06em',
      titleSize: '1.05rem',
      bodySize: '1.05rem',
      bodyLineHeight: '1.85',
    },
    assets: {
      youtube: {
        videoId: 'gzUu-FJ7s-Y',
        startTime: 146, // 2:26
        endTime: 152,   // 2:32
      },
      poster: '/images/ramayana-poster.jpg',
    },
    video: {
      opacity: 0.18,
      filters: {
        saturate: 1.05,
        contrast: 1.05,
      },
    },
  },
  varanasi: {
    colors: {
      dark: {
        bg: '#0A0604',           // deep ash
        surface: '#15100C',      // card background
        text: '#F5E6C8',         // temple parchment
        accent: '#B45309',       // deep saffron
        secondary: '#8B5E3C',    // ash brown
        muted: '#C9B8A0',        // muted parchment
      },
      light: {
        bg: '#1A1612',
        surface: '#2A2520',
        text: '#2A1F10',
        accent: '#A44309',
        secondary: '#7B4E2C',
        muted: '#B9A890',
      },
    },
    fonts: {
      heading: 'Cinzel',
      title: 'Inter',
      body: 'Inter',
    },
    typography: {
      headingSize: '2.6rem',
      headingLetterSpacing: '0.06em',
      titleSize: '1rem',
      bodySize: '1rem',
      bodyLineHeight: '1.7',
    },
    assets: {
      youtube: {
        videoId: 'odDvRxuP2wQ',
        startTime: 145, // 2:25
        endTime: 178,   // 2:58
      },
      poster: '/images/varanasi-poster.jpg',
    },
    video: {
      opacity: 0.22,
      filters: {
        saturate: 0.9,
        contrast: 1.1,
      },
    },
  },
};

/**
 * Get theme configuration
 */
export function getThemeConfig(theme: 'toxic' | 'ramayana' | 'varanasi' | null): ThemeConfig | null {
  if (!theme) return null;
  return THEME_CONFIGS[theme];
}

/**
 * Get video configuration by theme name (for global theme system)
 * @param theme - Theme name from next-themes (dark, light, toxic, rama, varanasi)
 * @returns Video config if theme has video, null otherwise
 */
export function getVideoConfigByTheme(theme: string | undefined | null): { youtube?: { videoId: string; startTime: number; endTime: number } } | null {
  if (!theme) return null;
  
  // Map theme names to config keys
  const themeMap: Record<string, 'toxic' | 'ramayana' | 'varanasi'> = {
    'toxic': 'toxic',
    'rama': 'ramayana',
    'varanasi': 'varanasi',
  };
  
  const configKey = themeMap[theme];
  if (!configKey) return null;
  
  const config = THEME_CONFIGS[configKey];
  if (!config?.assets?.youtube) return null;
  
  return {
    youtube: config.assets.youtube,
  };
}

