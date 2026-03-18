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
  { href: '/', label: 'Accueil', icon: Home },
  { href: '/games', label: 'Explorer', icon: Compass },
  { href: '/collections', label: 'Bibliotheque', icon: Library },
  { href: '/stats', label: 'Statistiques', icon: BarChart2 },
];

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
      <nav className="hidden items-center gap-2 md:flex" aria-label="Navigation principale">
        {navLinks.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all',
              isActive(href)
                ? 'border-primary/30 bg-primary/10 text-primary shadow-[0_0_0_1px_rgba(16,191,161,0.12)]'
                : 'border-transparent text-muted-foreground hover:border-white/8 hover:bg-white/5 hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetTrigger asChild>
          <button
            className="flex items-center justify-center rounded-full border border-white/10 bg-white/5 p-2 text-muted-foreground hover:text-foreground md:hidden"
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </SheetTrigger>

        <SheetContent
          side="right"
          className="w-80 border-l border-white/10 bg-[rgba(8,14,22,0.98)] p-0"
          showCloseButton={false}
        >
          <SheetHeader className="border-b border-white/10 px-5 py-5 text-left">
            <div className="flex items-start justify-between gap-4">
              <div>
                <SheetTitle className="font-oxanium text-xl font-bold tracking-[0.24em] text-gradient-primary">
                  AVALANCHE
                </SheetTitle>
                <SheetDescription className="mt-2 text-sm leading-6 text-muted-foreground">
                  Suivi personnel, backlog et decouverte dans une interface unique.
                </SheetDescription>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-full border border-white/10 p-2 text-muted-foreground hover:text-foreground"
                aria-label="Fermer le menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </SheetHeader>

          <div className="border-b border-white/10 px-5 py-4">
            {loading ? (
              <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
            ) : user && userProfile ? (
              <Link
                href="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex w-full items-center gap-3 rounded-2xl border border-white/8 bg-white/4 p-3 text-left transition-colors hover:bg-white/8"
              >
                {userProfile.profileImageUrl ? (
                  <img
                    src={userProfile.profileImageUrl}
                    alt={userProfile.username}
                    className="h-11 w-11 rounded-full border border-white/10 object-cover"
                  />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary">
                    {userProfile.username?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-foreground">{userProfile.username}</p>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Profil joueur</p>
                </div>
              </Link>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 gap-1.5"
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

          <nav className="flex flex-col gap-2 p-4" aria-label="Navigation mobile">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition-colors',
                  isActive(href)
                    ? 'border-primary/20 bg-primary/10 text-primary'
                    : 'border-transparent text-muted-foreground hover:border-white/8 hover:bg-white/5 hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            ))}

            {user ? (
              <Link
                href="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition-colors',
                  isActive('/profile')
                    ? 'border-primary/20 bg-primary/10 text-primary'
                    : 'border-transparent text-muted-foreground hover:border-white/8 hover:bg-white/5 hover:text-foreground'
                )}
              >
                <User className="h-4 w-4" />
                <span>Profil</span>
              </Link>
            ) : null}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default Navigation;
