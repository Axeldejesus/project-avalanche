import Link from 'next/link';
import Navigation from './Navigation';
import AuthButtonsWrapper from './AuthButtonsWrapper';

/**
 * Header — VOID PROTOCOL
 * Server Component — aucun JS client
 * Design : wordmark expanded + gradient accent inférieur
 */
const Header: React.FC = () => {
  return (
    <header className="glass sticky top-0 z-50 relative">
      {/* Ligne d'accent gradient en bas du header */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent" />

      <div className="mx-auto flex w-full max-w-[1600px] items-center gap-6 px-4 py-3.5 md:px-6 lg:px-8">

        {/* ── Wordmark ─────────────────────────────────────── */}
        <Link
          href="/"
          aria-label="Accueil Avalanche"
          className="group flex min-w-0 flex-col justify-center gap-0.5"
        >
          <span className="font-oxanium text-xl font-black tracking-[0.42em] text-gradient-primary transition-opacity duration-200 group-hover:opacity-90 md:text-[22px]">
            AVALANCHE
          </span>
          <span className="hidden items-center gap-1.5 text-[9px] font-medium uppercase tracking-[0.28em] text-muted-foreground/70 md:flex">
            <span className="h-1 w-1 rounded-full bg-primary/50" />
            Game Intelligence
          </span>
        </Link>

        {/* ── Navigation principale ─────────────────────── */}
        <Navigation />

        {/* ── Auth (desktop) ──────────────────────────────── */}
        <div className="ml-auto hidden md:flex md:items-center">
          <AuthButtonsWrapper />
        </div>

      </div>
    </header>
  );
};

export default Header;
