import type { ReactNode } from 'react';

interface PageIntroProps {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
  children?: ReactNode;
}

export default function PageIntro({
  eyebrow,
  title,
  description,
  actions,
  children,
}: PageIntroProps) {
  return (
    <section className="surface-panel surface-noise relative overflow-hidden rounded-[28px] p-6 md:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,191,161,0.16),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(247,201,93,0.1),transparent_28%)]" />
      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-3">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/80">
              {eyebrow}
            </p>
          ) : null}
          <div className="space-y-2">
            <h1 className="max-w-4xl text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
              {title}
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
              {description}
            </p>
          </div>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
      </div>
      {children ? <div className="relative z-10 mt-8">{children}</div> : null}
    </section>
  );
}