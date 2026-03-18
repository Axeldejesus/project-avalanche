import Link from 'next/link';
import Navigation from './Navigation';
import AuthButtonsWrapper from './AuthButtonsWrapper';

const Header: React.FC = () => {
  return (
    <header className="glass sticky top-0 z-50 border-b border-white/6">
      <div className="mx-auto flex w-full max-w-[1600px] items-center gap-4 px-4 py-4 md:px-6 lg:px-8">
        <Link
          href="/"
          className="flex min-w-0 flex-col justify-center"
          aria-label="Accueil Avalanche"
        >
          <span className="font-oxanium text-xl font-extrabold tracking-[0.34em] text-gradient-primary md:text-2xl">
            AVALANCHE
          </span>
          <span className="hidden text-[11px] uppercase tracking-[0.2em] text-muted-foreground md:block">
            Personal Game Tracker
          </span>
        </Link>

        <Navigation />

        <div className="ml-auto hidden md:flex md:items-center">
          <AuthButtonsWrapper />
        </div>
      </div>
    </header>
  );
};

export default Header;
