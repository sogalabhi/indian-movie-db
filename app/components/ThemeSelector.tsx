'use client';

import { Moon, Sun, Film } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Select disabled>
        <SelectTrigger className="w-[140px] h-10 glass-nav">
          <SelectValue placeholder="Theme" />
        </SelectTrigger>
      </Select>
    );
  }

  const getThemeIcon = (themeValue: string | undefined) => {
    switch (themeValue) {
      case 'dark':
        return <Moon className="h-4 w-4" />;
      case 'light':
        return <Sun className="h-4 w-4" />;
      case 'toxic':
        return <Film className="h-4 w-4" />;
      case 'rama':
        return <Film className="h-4 w-4" />;
      case 'varanasi':
        return <Film className="h-4 w-4" />;
      default:
        return <Sun className="h-4 w-4" />;
    }
  };

  const getThemeLabel = (themeValue: string | undefined) => {
    switch (themeValue) {
      case 'dark':
        return 'Dark';
      case 'light':
        return 'Light';
      case 'toxic':
        return 'TOXIC';
      case 'rama':
        return 'Ramayana';
      case 'varanasi':
        return 'Varanasi';
      default:
        return 'Dark';
    }
  };

  return (
    <Select value={theme || 'dark'} onValueChange={setTheme}>
      <SelectTrigger className="w-[140px] h-10 glass-nav transition-all duration-300 hover:scale-105">
        <div className="flex items-center gap-2">
          {getThemeIcon(theme)}
          <SelectValue>
            <span className="font-medium">{getThemeLabel(theme)}</span>
          </SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="dark">
          <div className="flex items-center gap-2">
            <Moon className="h-4 w-4" />
            <span>Dark</span>
          </div>
        </SelectItem>
        <SelectItem value="light">
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4" />
            <span>Light</span>
          </div>
        </SelectItem>
        <SelectItem value="toxic">
          <div className="flex items-center gap-2">
            <Film className="h-4 w-4" />
            <span>TOXIC</span>
          </div>
        </SelectItem>
        <SelectItem value="rama">
          <div className="flex items-center gap-2">
            <Film className="h-4 w-4" />
            <span>Ramayana</span>
          </div>
        </SelectItem>
        <SelectItem value="varanasi">
          <div className="flex items-center gap-2">
            <Film className="h-4 w-4" />
            <span>Varanasi</span>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

