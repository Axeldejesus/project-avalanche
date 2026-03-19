"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Calendar,
  Compass,
  Library,
  BarChart3,
  UserRound,
  Zap,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import GameCalendarModal from './modals/GameCalendarModal';
import { cn } from '@/lib/utils';

const sideLinks = [
  { href: '/',            label: 'Accueil',      icon: Compass  },
  { href: '/collections', label: 'Bibliothèque', icon: Library  },
  { href: '/stats',       label: 'Statistiques', icon: BarChart3 },
  { href: '/profile',     label: 'Profil',       icon: UserRound },
];

const quickActions = [
  { href: '/games',       label: 'Explorer les jeux',  icon: Compass,   description: 'Découvrir' },
  { href: '/collections', label: 'Ma collection',       icon: BookOpen,  description: 'Gérer' },
  { href: '/stats',       label: 'Voir mes stats',      icon: BarChart3, description: 'Analyser' },
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
      <aside className="sticky top-[88px] hidden h-fit w-[256px] shrink-0 space-y-2.5 xl:block">

        {/* ── Navigation rapide ──────────────────────────────── */}
        <div className="rounded-[18px] border border-border bg-gradient-to-b from-[hsl(223_26%_8.5%)] to-[hsl(223_30%_7%)] p-3">
          <p className="section-label mb-2.5 px-2">Navigation</p>
          <nav className="space-y-0.5" aria-label="Navigation secondaire">
            {sideLinks.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-white/4 hover:text-foreground'
                  )}
                >
                  {/* Indicateur actif barre gauche */}
                  <span
                    className={cn(
                      'h-3.5 w-0.5 shrink-0 rounded-full transition-all duration-200',
                      active ? 'bg-primary' : 'bg-transparent'
                    )}
                  />
                  <Icon className={cn('h-3.5 w-3.5 shrink-0', active ? 'text-primary' : '')} />
                  <span className="flex-1">{label}</span>
                  {active && <ChevronRight className="h-3 w-3 opacity-40" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* ── Calendrier ─────────────────────────────────────── */}
        <div className="overflow-hidden rounded-[18px] border border-border bg-gradient-to-b from-[hsl(223_26%_8.5%)] to-[hsl(223_30%_7%)]">
          {/* Ambient top glow */}
          <div className="pointer-events-none absolute h-16 w-full rounded-t-[18px] bg-gradient-to-b from-primary/6 to-transparent" />

          <div className="relative p-4">
            <div className="mb-3.5 flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-primary/12 text-primary">
                <Calendar className="h-3.5 w-3.5" />
              </div>
              <div>
                <h3 className="text-[13px] font-bold text-foreground">Calendrier</h3>
                <p className="text-[10px] text-muted-foreground">Sorties à venir</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-full border-border bg-transparent text-[12px] font-medium text-foreground hover:border-primary/35 hover:bg-primary/8 hover:text-primary"
              onClick={() => setIsCalendarModalOpen(true)}
            >
              Ouvrir le calendrier
            </Button>
          </div>
        </div>

        {/* ── Actions rapides ────────────────────────────────── */}
        <div className="rounded-[18px] border border-border bg-gradient-to-b from-[hsl(223_26%_8.5%)] to-[hsl(223_30%_7%)] p-3">
          <div className="mb-2.5 flex items-center gap-2 px-2">
            <Zap className="h-3 w-3 text-primary/50" />
            <p className="section-label">Actions rapides</p>
          </div>
          <div className="space-y-1">
            {quickActions.map(({ href, label, icon: Icon, description }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-xl px-3 py-2 transition-all duration-150 hover:bg-white/4"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-muted/60">
                  <Icon className="h-3 w-3 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium text-foreground">{label}</p>
                </div>
                <span className="text-[10px] text-muted-foreground/50">{description}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Tips workflow ───────────────────────────────────── */}
        <div className="rounded-[18px] border border-border bg-gradient-to-b from-[hsl(223_26%_8.5%)] to-[hsl(223_30%_7%)] p-4">
          <p className="section-label mb-3">Workflow</p>
          <ul className="space-y-2.5">
            {[
              'Classe tes jeux avec des statuts clairs pour rendre le backlog exploitable.',
              'Ajoute des reviews concises pour garder une trace utile de tes sessions.',
              'Utilise les listes perso pour organiser tes marathons ou sagas.',
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-primary/35" />
                <span className="text-[11.5px] leading-[1.6] text-muted-foreground">{tip}</span>
              </li>
            ))}
          </ul>
        </div>

      </aside>

      {/* ── FAB mobile calendrier ──────────────────────────────── */}
      <button
        className={cn(
          'fixed bottom-5 right-5 z-40 xl:hidden',
          'flex h-13 w-13 items-center justify-center rounded-full',
          'bg-primary text-white',
          'shadow-[0_12px_32px_rgba(108,68,245,0.45)]',
          'border border-primary/40 transition-all duration-200 hover:scale-105 active:scale-95'
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
