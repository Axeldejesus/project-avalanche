import { cn } from '@/lib/utils';

/**
 * StatusBadge — VOID PROTOCOL
 * Design : dot coloré + label, fond translucide teinté
 * "playing" : dot avec animation pulse
 */

export type GameCollectionStatus =
  | 'playing'
  | 'completed'
  | 'toPlay'
  | 'abandoned'
  | 'wishlist'
  | 'backlog'
  | 'dropped';

const statusMeta = {
  playing: {
    label: 'En cours',
    dotClass: 'bg-emerald-400 animate-[statusPulse_2s_ease-in-out_infinite] shadow-[0_0_7px_rgba(52,211,153,0.8)]',
    chipClass: 'bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/20',
  },
  completed: {
    label: 'Terminé',
    dotClass: 'bg-cyan-400',
    chipClass: 'bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-400/20',
  },
  toPlay: {
    label: 'Backlog',
    dotClass: 'bg-amber-400',
    chipClass: 'bg-amber-400/10 text-amber-300 ring-1 ring-amber-400/20',
  },
  abandoned: {
    label: 'Abandonné',
    dotClass: 'bg-rose-400',
    chipClass: 'bg-rose-400/10 text-rose-300 ring-1 ring-rose-400/20',
  },
  wishlist: {
    label: 'Wishlist',
    dotClass: 'bg-fuchsia-400',
    chipClass: 'bg-fuchsia-400/10 text-fuchsia-300 ring-1 ring-fuchsia-400/20',
  },
} as const;

function normalizeStatus(status: GameCollectionStatus): keyof typeof statusMeta {
  if (status === 'backlog') return 'toPlay';
  if (status === 'dropped') return 'abandoned';
  return status;
}

export function getStatusMeta(status: GameCollectionStatus) {
  return statusMeta[normalizeStatus(status)];
}

interface StatusBadgeProps {
  status: GameCollectionStatus;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const meta = getStatusMeta(status);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]',
        meta.chipClass,
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', meta.dotClass)} />
      {meta.label}
    </span>
  );
}
