'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: number;
  name: string;
  cover: string;
  rating?: number;
  genres?: string;
  releaseYear?: number;
}

interface SearchBarProps {
  className?: string;
}

export default function SearchBar({ className }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [cachedResults, setCachedResults] = useState<Record<string, SearchResult[]>>({});
  const router = useRouter();
  const pathname = usePathname();
  const searchRef = useRef<HTMLDivElement>(null);

  const cachedSearchResults = useMemo(() => {
    return cachedResults[query] || null;
  }, [query, cachedResults]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchGames = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      if (cachedSearchResults) {
        setResults(cachedSearchResults);
        setShowResults(true);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        setResults(data);
        setShowResults(true);
        setCachedResults(prev => ({ ...prev, [query]: data }));
      } catch (error) {
        console.error('Error searching games:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const delay = setTimeout(searchGames, 300);
    return () => clearTimeout(delay);
  }, [query, cachedSearchResults]);

  const handleResultClick = (gameId: number) => {
    if (pathname === '/games') {
      sessionStorage.setItem('cameFromGames', 'true');
    } else if (pathname === '/') {
      sessionStorage.removeItem('cameFromGames');
      sessionStorage.setItem('cameFromHome', 'true');
    } else if (!pathname || !pathname.startsWith('/games/')) {
      sessionStorage.removeItem('cameFromGames');
      sessionStorage.removeItem('cameFromHome');
    }
    router.push(`/games/${gameId}`);
    setShowResults(false);
    setQuery('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (results.length > 0) handleResultClick(results[0].id);
  };

  return (
    <div ref={searchRef} className={cn('relative w-full max-w-sm', className)}>
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <Input
          type="text"
          placeholder="Rechercher un jeu..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setShowResults(true)}
          className="pr-10 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/50"
        />
        <button
          type="submit"
          className="absolute right-2 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </button>
      </form>

      {showResults && results.length > 0 && (
        <div className="absolute top-full mt-1 left-0 right-0 z-50 max-h-80 overflow-y-auto rounded-lg border border-border bg-popover shadow-xl">
          {results.map((game, idx) => (
            <button
              key={`${game.id}-${idx}`}
              type="button"
              onClick={() => handleResultClick(game.id)}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-accent/50 focus:bg-accent/50 focus:outline-none"
            >
              {game.cover && (
                <img
                  src={game.cover}
                  alt={game.name}
                  className="h-10 w-8 flex-shrink-0 rounded object-cover"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{game.name}</p>
                {game.releaseYear && (
                  <p className="text-xs text-muted-foreground">{game.releaseYear}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
