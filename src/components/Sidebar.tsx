"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, Compass, Library, BarChart3, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GameCalendarModal from './modals/GameCalendarModal';
import { cn } from '@/lib/utils';

const sideLinks = [
  { href: '/', label: 'Accueil', icon: Compass },
  { href: '/collections', label: 'Bibliotheque', icon: Library },
  { href: '/stats', label: 'Statistiques', icon: BarChart3 },
  { href: '/profile', label: 'Profil', icon: UserRound },
];

const Sidebar: React.FC = () => {
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }

    return pathname?.startsWith(href);
  };

  return (
    <>
      <aside className="sticky top-[96px] hidden h-fit w-72 flex-shrink-0 space-y-4 xl:block">
        <div className="surface-panel rounded-[24px] p-4">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/80">
            Navigation rapide
          </p>
          <nav className="space-y-2" aria-label="Navigation secondaire">
            {sideLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition-all',
                  isActive(href)
                    ? 'border-primary/20 bg-primary/10 text-primary'
                    : 'border-transparent text-muted-foreground hover:border-white/8 hover:bg-white/5 hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="surface-panel rounded-[24px] p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Calendrier des sorties</h3>
              <p className="text-xs text-muted-foreground">Reste proche des prochaines sorties majeures.</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full justify-center border-white/10 bg-white/5 hover:bg-white/8"
            onClick={() => setIsCalendarModalOpen(true)}
          >
            Ouvrir le calendrier
          </Button>
        </div>

        <div className="surface-panel rounded-[24px] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Workflow
          </p>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li>Classe tes jeux avec des statuts clairs pour rendre le backlog exploitable.</li>
            <li>Ajoute des reviews concises pour garder une trace utile de tes sessions.</li>
            <li>Utilise les listes perso pour organiser tes marathons, sorties ou sagas.</li>
          </ul>
        </div>
      </aside>

      <button
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full border border-primary/20 bg-primary text-white shadow-[0_18px_40px_rgba(16,191,161,0.35)] transition-transform hover:scale-105 active:scale-95 xl:hidden"
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
