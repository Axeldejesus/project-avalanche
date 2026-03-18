import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  actions?: ReactNode;
}

export default function EmptyState({ title, description, actions }: EmptyStateProps) {
  return (
    <div className="surface-panel rounded-[24px] px-6 py-10 text-center">
      <div className="mx-auto max-w-md space-y-3">
        <h3 className="text-xl font-semibold text-foreground">{title}</h3>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        {actions ? <div className="flex justify-center gap-3 pt-2">{actions}</div> : null}
      </div>
    </div>
  );
}