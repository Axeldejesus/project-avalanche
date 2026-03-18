import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title: string;
  description: string;
  actions?: ReactNode;
  className?: string;
}

/**
 * EmptyState — VOID PROTOCOL
 * Design : fond dot-grid géométrique, text centré, mémorable
 */
export default function EmptyState({ title, description, actions, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[20px] border border-border',
        'bg-gradient-to-b from-[hsl(223_26%_8%)] to-[hsl(223_30%_6%)]',
        'px-6 py-14 text-center',
        className
      )}
    >
      {/* Fond géométrique */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 0)',
          backgroundSize: '20px 20px',
        }}
      />

      {/* Lueur centrale ambiant */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/6 blur-[60px]" />

      {/* Icône décorative (losange) */}
      <div className="relative z-10 mb-5 inline-flex items-center justify-center rounded-2xl border border-border bg-muted/50 p-4">
        <div className="h-6 w-6 rotate-45 rounded-sm border border-primary/40 bg-primary/10" />
      </div>

      <div className="relative z-10 mx-auto max-w-sm space-y-2">
        <h3 className="text-lg font-bold tracking-tight text-foreground">{title}</h3>
        <p className="text-sm leading-[1.7] text-muted-foreground">{description}</p>
        {actions && (
          <div className="flex justify-center gap-3 pt-4">{actions}</div>
        )}
      </div>
    </div>
  );
}
