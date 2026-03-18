"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, Compass, Library, BarChart3, UserRound, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GameCalendarModal from './modals/GameCalendarModal';
import { cn } from '@/lib/utils';

const sideLinks = [
  { href: '/',            label: 'Accueil',      icon: Compass  },
  { href: '/collections', label: 'Bibliothèque', icon: Library  },
  { href: '/stats',       label: 'Statistiques', icon: BarChart3 },
  { href: '/profile',     label: 'Profil',       icon: UserRound },
];

const workflowTips = [
  'Classe tes jeux avec des statuts clairs pour rendre le backlog exploitable.',
  'Ajoute des reviews concises pour garder une trace utile de tes sessions.',
  'Utilise les listes perso pour organiser tes marathons ou sagas.',
];

/**
 * Sidebar — VOID PROTOCOL
 * Left-border active indicator, panneaux épurés
 */
const Sidebar: React.FC = () => {
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname?.startsWith(href);

  return (
    <>
      <aside className="sticky top-[88px] hidden h-fit w-[260px] shrink-0 space-y-3 xl:block">

        {/* Navigation rapide */}
        <div className="rounded-[20px] border border-border bg-gradient-to-b from-[hsl(223_26%_8.5%)] to-[hsl(223_30%_7%)] p-3">
          <p className="mb-3 px-2 text-[9px] font-bold uppercase tracking-[0.28em] text-primary/50">
            Navigation
          </p>
          <nav className="space-y-0.5" aria-label="Navigation secondaire">
            {sideLinks.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-white/4 hover:text-foreground'
                  )}
                >
                  {/* Indicateur actif barre gauche */}
                  <span
                    className={cn(
                      'h-4 w-0.5 shrink-0 rounded-full transition-all',
                      active ? 'bg-primary' : 'bg-transparent'
                    )}
                  />
                  <Icon className={cn('h-4 w-4 shrink-0 transition-colors', active ? 'text-primary' : '')} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Widget calendrier */}
        <div className="rounded-[20px] border border-border bg-gradient-to-b from-[hsl(223_26%_8.5%)] to-[hsl(223_30%_7%)] p-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Calendrier</h3>
              <p className="text-[11px] text-muted-foreground">Sorties à venir</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full border-border bg-muted/30 text-foreground hover:border-primary/30 hover:bg-primary/8 hover:text-primary"
            onClick={() => setIsCalendarModalOpen(true)}
          >
            Ouvrir le calendrier
          </Button>
        </div>

        {/* Tips workflow */}
        <div className="rounded-[20px] border border-border bg-gradient-to-b from-[hsl(223_26%_8.5%)] to-[hsl(223_30%_7%)] p-4">
          <div className="mb-3 flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-primary/60" />
            <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-primary/50">
              Workflow
            </p>
          </div>
          <ul className="space-y-3">
            {workflowTips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/40" />
                <span className="text-[12px] leading-[1.6] text-muted-foreground">{tip}</span>
              </li>
            ))}
          </ul>
        </div>

      </aside>

      {/* FAB mobile calendrier */}
      <button
        className={cn(
          'fixed bottom-5 right-5 z-40 xl:hidden',
          'flex h-14 w-14 items-center justify-center rounded-full',
          'bg-primary text-white shadow-[0_16px_40px_rgba(108,68,245,0.4)]',
          'border border-primary/40 transition-transform hover:scale-105 active:scale-95'
        )}
        onClick={() => setIsCalendarModalOpen(true)}
        aria-label="Ouvrir le calendrier des sorties"
      >
        <Calendar className="h-5 w-5" />
      </button>

      <GameCalendarModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
      />
    </>
  );
};

export default Sidebar;
