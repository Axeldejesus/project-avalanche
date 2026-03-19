import Link from 'next/link';
import Navigation from './Navigation';
import AuthButtonsWrapper from './AuthButtonsWrapper';

/**
 * Header — VOID PROTOCOL
 * Server Component — aucun JS client
 * Design : wordmark expanded + gradient accent inférieur + top accent line
 */
const Header: React.FC = () => {
  return (
    <header className="glass sticky top-0 z-50 relative">
      {/* Ligne d'accent top (très subtile) */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/15 to-transparent" />
      {/* Ligne d'accent bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <div className="mx-auto flex w-full max-w-[1600px] items-center gap-6 px-4 py-3 md:px-6 lg:px-8">

        {/* ── Wordmark ─────────────────────────────────────── */}
        <Link
          href="/"
          aria-label="Accueil Avalanche"
          className="group flex min-w-0 flex-col justify-center gap-0.5 shrink-0"
        >
          <span className="font-oxanium text-[20px] font-black tracking-[0.42em] text-gradient-primary transition-opacity duration-200 group-hover:opacity-85 md:text-[21px]">
            AVALANCHE
          </span>
          <span className="hidden items-center gap-1.5 text-[8.5px] font-semibold uppercase tracking-[0.3em] text-muted-foreground/55 md:flex">
            <span className="h-[5px] w-[5px] rounded-full bg-primary/50" />
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
