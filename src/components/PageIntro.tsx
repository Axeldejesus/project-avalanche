import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageIntroProps {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}

/**
 * PageIntro — VOID PROTOCOL
 * Design : Banner éditorial avec ambient indigo + dot grid
 */
export default function PageIntro({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
}: PageIntroProps) {
  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-[24px] border border-border',
        'bg-gradient-to-b from-[hsl(223_28%_9%)] to-[hsl(223_32%_6.5%)]',
        className
      )}
    >
      {/* Ambient glows — plus intenses */}
      <div className="pointer-events-none absolute -left-12 -top-12 h-64 w-64 rounded-full bg-primary/10 blur-[80px]" />
      <div className="pointer-events-none absolute -right-8 bottom-0 h-48 w-48 rounded-full bg-[hsl(var(--ice))]/7 blur-[64px]" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-32 w-72 -translate-x-1/2 rounded-full bg-primary/5 blur-[60px]" />

      {/* Dot grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Ligne d'accent haut */}
      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <div className="relative z-10 p-6 md:p-8 lg:p-10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">

            {eyebrow && (
              <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-primary/75">
                <span className="h-px w-5 bg-gradient-to-r from-primary/60 to-transparent" />
                {eyebrow}
              </p>
            )}

            <h1 className="text-3xl font-black leading-[1.08] tracking-tight text-foreground md:text-[44px] lg:text-[50px]">
              {title}
            </h1>

            <p className="max-w-2xl text-sm leading-[1.8] text-muted-foreground md:text-[14.5px]">
              {description}
            </p>
          </div>

          {actions && (
            <div className="flex flex-wrap items-center gap-3 lg:shrink-0">
              {actions}
            </div>
          )}
        </div>

        {children && (
          <>
            <div className="section-divider mt-6 mb-5" />
            <div>{children}</div>
          </>
        )}
      </div>
    </section>
  );
}
