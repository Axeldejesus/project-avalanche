import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';

interface AppShellProps {
  children: ReactNode;
  sidebar?: ReactNode;
  contentClassName?: string;
}

export default function AppShell({
  children,
  sidebar,
  contentClassName,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground ambient-bg">
      <Header />
      <div className="mx-auto flex w-full max-w-[1600px] gap-6 px-4 pb-10 pt-6 md:px-6 lg:px-8">
        {sidebar ?? <Sidebar />}
        <main className={cn('min-w-0 flex-1', contentClassName)}>{children}</main>
      </div>
    </div>
  );
}