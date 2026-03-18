'use client';

import { useState } from 'react';
import { Home, Compass, Library, BarChart2, Menu, X, LogIn, UserPlus, User } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/',            label: 'Accueil',      icon: Home     },
  { href: '/games',       label: 'Explorer',     icon: Compass  },
  { href: '/collections', label: 'Bibliothèque', icon: Library  },
  { href: '/stats',       label: 'Statistiques', icon: BarChart2 },
];

/**
 * Navigation — VOID PROTOCOL
 * Desktop : liens texte avec indicateur underline actif glissant
 * Mobile  : Sheet droite redesignée, layout épuré
 */
const Navigation: React.FC = () => {
  const pathname = usePathname();
  const { user, userProfile, loading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname?.startsWith(path)) return true;
    return false;
  };

  const handleLoginClick = () => {
    setIsMobileMenuOpen(false);
    window.dispatchEvent(new CustomEvent('openLoginModal'));
  };

  const handleRegisterClick = () => {
    setIsMobileMenuOpen(false);
    window.dispatchEvent(new CustomEvent('openRegisterModal'));
  };

  return (
    <>
      {/* ── Navigation desktop ─────────────────────────────── */}
      <nav className="hidden items-center md:flex" aria-label="Navigation principale">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'relative flex items-center gap-2 px-3.5 py-2.5 text-[13px] font-medium transition-colors duration-200',
                active
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground/80'
              )}
            >
              <Icon className={cn('h-3.5 w-3.5 transition-colors', active ? 'text-primary' : '')} />
              <span>{label}</span>
              {/* Indicateur actif — barre indigo en bas */}
              <span
                className={cn(
                  'absolute bottom-0 left-1/2 h-px -translate-x-1/2 rounded-full bg-primary transition-all duration-300',
                  active ? 'w-2/3 opacity-100' : 'w-0 opacity-0'
                )}
              />
            </Link>
          );
        })}
      </nav>

      {/* ── Menu mobile (Sheet) ─────────────────────────────── */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetTrigger asChild>
          <button
            className="flex items-center justify-center rounded-xl border border-border bg-muted/60 p-2 text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground md:hidden"
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </SheetTrigger>

        <SheetContent
          side="right"
          className="w-[280px] border-l border-border bg-[hsl(223_30%_6%)] p-0 sm:w-80"
          showCloseButton={false}
        >
          {/* En-tête Sheet */}
          <SheetHeader className="border-b border-border px-5 py-4 text-left">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="font-oxanium text-lg font-black tracking-[0.38em] text-gradient-primary">
                  AVALANCHE
                </SheetTitle>
                <SheetDescription className="mt-1 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70">
                  <span className="h-1 w-1 rounded-full bg-primary/50" />
                  Game Intelligence
                </SheetDescription>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-xl border border-border p-2 text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
                aria-label="Fermer le menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </SheetHeader>

          {/* Profil utilisateur ou CTA auth */}
          <div className="border-b border-border px-4 py-4">
            {loading ? (
              <div className="h-14 animate-pulse rounded-xl bg-muted" />
            ) : user && userProfile ? (
              <Link
                href="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-muted/40 p-3 text-left transition-colors hover:border-primary/25 hover:bg-primary/5"
              >
                {userProfile.profileImageUrl ? (
                  <img
                    src={userProfile.profileImageUrl}
                    alt={userProfile.username}
                    className="h-10 w-10 rounded-full border border-border object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                    {userProfile.username?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{userProfile.username}</p>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Profil joueur</p>
                </div>
              </Link>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 gap-1.5 text-muted-foreground hover:text-foreground"
                  onClick={handleLoginClick}
                >
                  <LogIn className="h-4 w-4" />
                  Connexion
                </Button>
                <Button
                  size="sm"
                  className="flex-1 gap-1.5"
                  onClick={handleRegisterClick}
                >
                  <UserPlus className="h-4 w-4" />
                  S'inscrire
                </Button>
              </div>
            )}
          </div>

          {/* Liens de navigation */}
          <nav className="flex flex-col p-3" aria-label="Navigation mobile">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-colors',
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-white/4 hover:text-foreground'
                  )}
                >
                  {/* Indicateur actif gauche */}
                  <span className={cn('h-5 w-0.5 rounded-full transition-all', active ? 'bg-primary' : 'bg-transparent')} />
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{label}</span>
                </Link>
              );
            })}

            {user && (
              <Link
                href="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-colors',
                  isActive('/profile')
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-white/4 hover:text-foreground'
                )}
              >
                <span className={cn('h-5 w-0.5 rounded-full transition-all', isActive('/profile') ? 'bg-primary' : 'bg-transparent')} />
                <User className="h-4 w-4 shrink-0" />
                <span>Profil</span>
              </Link>
            )}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default Navigation;
