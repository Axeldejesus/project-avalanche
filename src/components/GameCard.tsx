'use client';

import { useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getStatusMeta, type GameCollectionStatus } from '@/components/StatusBadge';

/* ── Couleur dot par statut ─────────────────────────────────── */
function getDotClass(status: string): string {
  const map: Record<string, string> = {
    playing:   'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] animate-[statusPulse_2s_ease-in-out_infinite]',
    completed: 'bg-cyan-400',
    toPlay:    'bg-amber-400',
    abandoned: 'bg-rose-400',
    wishlist:  'bg-fuchsia-400',
  };
  return map[status] ?? 'bg-white/40';
}

/* ── Border gauche colorée par statut ───────────────────────── */
const LEFT_BORDER: Record<string, string> = {
  playing:   'border-l-emerald-400/80',
  completed: 'border-l-cyan-400/80',
  toPlay:    'border-l-amber-400/80',
  abandoned: 'border-l-rose-400/80',
  wishlist:  'border-l-fuchsia-400/80',
};

/* ── Types ───────────────────────────────────────────────────── */
interface GameData {
  id: number;
  name: string;
  cover: string;
  rating?: number;
  genres?: string;
}

interface GameCardProps {
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

/* ── Composant ───────────────────────────────────────────────── */
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
  const router   = useRouter();
  const pathname = usePathname();
  const cardRef  = useRef<HTMLButtonElement>(null);
  const [tilt, setTilt]       = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  /* Résolution des props (rétrocompatibilité) */
  const resolvedId     = id     ?? game?.id     ?? 0;
  const resolvedName   = name   ?? game?.name   ?? '';
  const resolvedCover  = cover  ?? game?.cover  ?? '';
  const resolvedRating = rating ?? game?.rating;
  const resolvedGenres = genres ?? game?.genres;

  /* Normalisation du statut */
  const normalStatus =
    status === 'backlog' ? 'toPlay' :
    status === 'dropped' ? 'abandoned' :
    status;
  const metaStatus = normalStatus ? getStatusMeta(normalStatus) : null;

  /* ── Handlers ─────────────────────────────────────────────── */
  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;   // 0 → 1
    const py = (e.clientY - rect.top)  / rect.height;  // 0 → 1
    setTilt({ x: (py - 0.5) * -10, y: (px - 0.5) * 10 });
  };

  const handleMouseEnter = () => setHovered(true);

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setHovered(false);
  };

  const handleClick = () => {
    if (onClick) { onClick(resolvedId); return; }
    sessionStorage.removeItem('cameFromGames');
    sessionStorage.removeItem('cameFromCollection');
    sessionStorage.removeItem('cameFromCustomList');
    sessionStorage.removeItem('cameFromProfile');
    if (pathname === '/') sessionStorage.setItem('cameFromHome', 'true');
    router.push(`/games/${resolvedId}`);
  };

  /* ── Rendu ────────────────────────────────────────────────── */
  return (
    <button
      ref={cardRef}
      type="button"
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: hovered
          ? 'transform 0.08s ease, box-shadow 0.3s ease, border-color 0.3s ease'
          : 'transform 0.5s ease,  box-shadow 0.3s ease, border-color 0.3s ease',
      }}
      className={cn(
        /* Base */
        'group relative overflow-hidden text-left',
        'rounded-[18px] bg-card border border-border',
        /* Status : 3px border gauche colorée */
        normalStatus && ['border-l-[3px]', LEFT_BORDER[normalStatus]],
        /* Hover : glow indigo */
        'hover:border-primary/35',
        'hover:shadow-[0_0_0_1px_rgba(108,68,245,0.12),0_24px_70px_rgba(0,0,0,0.6),0_0_50px_rgba(108,68,245,0.09)]',
        className
      )}
    >
      {/* ── Cover image (ratio 3:4) ──────────────────────── */}
      <div className="relative w-full overflow-hidden" style={{ paddingTop: '133%' }}>
        <img
          src={resolvedCover}
          alt={resolvedName}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.07]"
          loading="lazy"
        />

        {/* Vignette permanente */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />

        {/* Overlay renforcé au hover (révèle les métadonnées) */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#070812]/96 via-[#070812]/55 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />

        {/* Score badge (ambre) — coin supérieur droit */}
        {resolvedRating !== undefined && resolvedRating > 0 && (
          <div className="score-badge absolute right-2.5 top-2.5 px-2 py-0.5 text-[11px]">
            {resolvedRating.toFixed(1)}
          </div>
        )}

        {/* Status indicator — coin supérieur gauche */}
        {metaStatus && normalStatus && (
          <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5 rounded-full bg-black/55 px-2 py-0.5 backdrop-blur-sm">
            <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', getDotClass(normalStatus))} />
            <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/75">
              {metaStatus.label}
            </span>
          </div>
        )}

        {/* CTA arrow — apparaît au hover */}
        <div
          className={cn(
            'absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full',
            'border border-primary/40 bg-primary/15 text-primary backdrop-blur-sm',
            'translate-x-1 translate-y-1 opacity-0 transition-all duration-300',
            'group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100'
          )}
        >
          <ArrowUpRight className="h-3.5 w-3.5" />
        </div>
      </div>

      {/* ── Footer (variant default) ─────────────────────── */}
      {variant !== 'compact' && (
        <div className="relative space-y-1 px-3 py-2.5">
          <h3 className="line-clamp-2 min-h-[40px] text-[13px] font-semibold leading-[1.35] tracking-[-0.01em] text-foreground">
            {resolvedName}
          </h3>
          {resolvedGenres && (
            <p className="line-clamp-1 text-[11px] text-muted-foreground/75">
              {resolvedGenres}
            </p>
          )}
        </div>
      )}
    </button>
  );
}
