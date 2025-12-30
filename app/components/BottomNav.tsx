'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Newspaper, BookmarkCheck, Scale, User, Eye } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/news', label: 'News', icon: Newspaper },
  { href: '/watchlist', label: 'Watchlist', icon: BookmarkCheck, requiresAuth: true },
  { href: '/watched', label: 'Watched', icon: Eye, requiresAuth: true },
  { href: '/compare', label: 'Compare', icon: Scale },
  { href: '/profile', label: 'Profile', icon: User, requiresAuth: true },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  // Filter nav items based on auth requirements
  const visibleItems = navItems.filter(
    (item) => !item.requiresAuth || user
  );

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[9999] glass-nav border-t border-border/50 h-[60px] md:h-[70px] lg:h-[80px]">
      <div className="flex items-center justify-around h-full px-2 pb-safe">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname?.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 min-w-[60px] h-full',
                'transition-all duration-200 ease-in-out',
                'relative group',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div
                className={cn(
                  'p-2 rounded-lg transition-all duration-200',
                  isActive && 'bg-primary/10 scale-110'
                )}
              >
                <Icon className={cn(
                  'h-5 w-5 md:h-6 md:w-6 transition-transform duration-200',
                  isActive && 'scale-110'
                )} />
              </div>
              <span className={cn(
                'text-[10px] md:text-xs font-medium transition-all duration-200',
                isActive && 'scale-105'
              )}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

