'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Star, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import StatusBadge, { type GameCollectionStatus } from '@/components/StatusBadge';

interface GameData {
  id: number;
  name: string;
  cover: string;
  rating?: number;
  genres?: string;
}

interface GameCardProps {
  // Nouvelle interface (props directes)
  id?: number;
  name?: string;
  cover?: string;
  rating?: number;
  genres?: string;
  game?: GameData;
  status?: GameCollectionStatus;
  variant?: 'default' | 'compact';
  className?: string;
  onClick?: (id: number) => void;
}

export default function GameCard({
  id,
  name,
  cover,
  rating,
  genres,
  game,
  status,
  variant = 'default',
  className,
  onClick,
}: GameCardProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Résolution des props (rétrocompatibilité avec l'ancienne API `game`)
  const resolvedId = id ?? game?.id ?? 0;
  const resolvedName = name ?? game?.name ?? '';
  const resolvedCover = cover ?? game?.cover ?? '';
  const resolvedRating = rating ?? game?.rating;
  const resolvedGenres = genres ?? game?.genres;

  const handleClick = () => {
    if (onClick) {
      onClick(resolvedId);
      return;
    }
    sessionStorage.removeItem('cameFromGames');
    sessionStorage.removeItem('cameFromCollection');
    sessionStorage.removeItem('cameFromCustomList');
    sessionStorage.removeItem('cameFromProfile');
    if (pathname === '/') {
      sessionStorage.setItem('cameFromHome', 'true');
    }
    router.push(`/games/${resolvedId}`);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'group relative overflow-hidden rounded-[22px] border border-white/8 bg-[linear-gradient(180deg,rgba(18,30,42,0.94),rgba(10,16,25,0.98))] text-left transition-all duration-300',
        'hover:-translate-y-1.5 hover:border-primary/30 hover:shadow-[0_20px_50px_rgba(0,0,0,0.38)]',
        className
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,191,161,0.14),transparent_28%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative w-full overflow-hidden" style={{ paddingTop: '133%' }}>
        <img
          src={resolvedCover}
          alt={resolvedName}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(6,12,18,0.95)] via-[rgba(6,12,18,0.2)] to-transparent" />

        {resolvedRating !== undefined && resolvedRating > 0 && (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full border border-white/10 bg-black/45 px-2.5 py-1 text-xs font-semibold text-amber-200 backdrop-blur-sm">
            <Star className="h-2.5 w-2.5 fill-current" />
            {resolvedRating.toFixed(1)}
          </div>
        )}

        {status && (
          <StatusBadge status={status} className="absolute left-3 top-3" />
        )}

        <div className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/35 text-white/80 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
          <ArrowUpRight className="h-4 w-4" />
        </div>
      </div>

      {variant !== 'compact' && (
        <div className="relative space-y-2 p-4">
          <h3 className="line-clamp-2 min-h-11 text-base font-semibold leading-tight text-foreground">
            {resolvedName}
          </h3>
          {resolvedGenres && (
            <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">{resolvedGenres}</p>
          )}
        </div>
      )}
    </button>
  );
}
