import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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
    className: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200',
  },
  completed: {
    label: 'Termine',
    className: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-200',
  },
  toPlay: {
    label: 'Backlog',
    className: 'border-amber-400/20 bg-amber-400/10 text-amber-100',
  },
  abandoned: {
    label: 'Abandonne',
    className: 'border-rose-400/20 bg-rose-400/10 text-rose-200',
  },
  wishlist: {
    label: 'Wishlist',
    className: 'border-fuchsia-400/20 bg-fuchsia-400/10 text-fuchsia-200',
  },
} as const;

function normalizeStatus(status: GameCollectionStatus) {
  if (status === 'backlog') {
    return 'toPlay';
  }

  if (status === 'dropped') {
    return 'abandoned';
  }

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
    <Badge
      variant="outline"
      className={cn('rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]', meta.className, className)}
    >
      {meta.label}
    </Badge>
  );
}