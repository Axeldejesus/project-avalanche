"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookMarked,
  Grid2x2,
  Heart,
  LayoutList,
  Library,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import EmptyState from '@/components/EmptyState';
import PageIntro from '@/components/PageIntro';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthContext';
import type { CollectionItem, CollectionStats, List, ListGame } from '@/schemas';
import { getUserCollectionForStats, removeFromCollection } from '@/services/collectionService';
import { createList, deleteList, getGamesInList, getUserLists, removeGameFromList } from '@/services/listService';

type ViewMode = 'grid' | 'list';
type LibraryTab = 'collection' | 'lists';
type StatusFilter = 'all' | 'playing' | 'completed' | 'toPlay' | 'abandoned' | 'wishlist';

const emptyStats: CollectionStats = {
  total: 0,
  completed: 0,
  playing: 0,
  toPlay: 0,
  abandoned: 0,
  wishlist: 0,
};

const statusFilters: Array<{
  key: StatusFilter;
  label: string;
  getValue: (stats: CollectionStats) => number;
}> = [
  { key: 'all', label: 'Tous', getValue: (stats) => stats.total },
  { key: 'playing', label: 'En cours', getValue: (stats) => stats.playing },
  { key: 'completed', label: 'Termines', getValue: (stats) => stats.completed },
  { key: 'toPlay', label: 'Backlog', getValue: (stats) => stats.toPlay },
  { key: 'wishlist', label: 'Wishlist', getValue: (stats) => stats.wishlist },
];

function formatDate(value?: string) {
  if (!value) {
    return 'Date inconnue';
  }

  return new Date(value).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function CollectionCard({
  item,
  viewMode,
  onOpen,
  onRemove,
}: {
  item: CollectionItem;
  viewMode: ViewMode;
  onOpen: (gameId: number) => void;
  onRemove: (gameId: number, gameName: string) => void;
}) {
  if (viewMode === 'list') {
    return (
      <div className="surface-panel flex flex-col gap-4 rounded-[24px] p-4 md:flex-row md:items-center">
        <button
          type="button"
          onClick={() => onOpen(item.gameId)}
          className="flex min-w-0 flex-1 items-center gap-4 text-left"
        >
          <img
            src={item.gameCover}
            alt={item.gameName}
            className="h-28 w-20 rounded-[18px] object-cover"
          />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={item.status} />
              {item.rating ? (
                <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-xs text-amber-200">
                  {item.rating.toFixed(1)}/5
                </span>
              ) : null}
            </div>
            <h3 className="text-lg font-semibold text-foreground">{item.gameName}</h3>
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {[...(item.genres || []), ...(item.platforms || [])].join(' • ') || 'Aucune metadonnee'}
            </p>
            <div className="flex flex-wrap gap-4 text-xs uppercase tracking-[0.16em] text-muted-foreground">
              <span>Ajoute le {formatDate(item.addedAt)}</span>
              {item.hoursPlayed ? <span>{item.hoursPlayed}h jouees</span> : null}
            </div>
            {item.notes ? <p className="line-clamp-2 text-sm text-foreground/85">{item.notes}</p> : null}
          </div>
        </button>
        <Button
          variant="outline"
          className="border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/15"
          onClick={() => onRemove(item.gameId, item.gameName)}
        >
          <Trash2 className="h-4 w-4" />
          Retirer
        </Button>
      </div>
    );
  }

  return (
    <div className="surface-panel overflow-hidden rounded-[24px]">
      <button type="button" onClick={() => onOpen(item.gameId)} className="w-full text-left">
        <div className="relative aspect-[3/4] overflow-hidden">
          <img src={item.gameCover} alt={item.gameName} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
          <StatusBadge status={item.status} className="absolute left-3 top-3" />
        </div>
        <div className="space-y-2 p-4">
          <h3 className="line-clamp-2 text-base font-semibold text-foreground">{item.gameName}</h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {item.genres?.join(' • ') || item.genre || 'Aucun genre renseigne'}
          </p>
          <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
            <span>{formatDate(item.updatedAt)}</span>
            {item.hoursPlayed ? <span>{item.hoursPlayed}h</span> : null}
          </div>
        </div>
      </button>
      <div className="border-t border-white/8 p-4 pt-0">
        <Button
          variant="ghost"
          className="mt-3 w-full justify-center text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => onRemove(item.gameId, item.gameName)}
        >
          Retirer de la bibliotheque
        </Button>
      </div>
    </div>
  );
}

function ListGameCard({
  game,
  viewMode,
  onOpen,
  onRemove,
}: {
  game: ListGame;
  viewMode: ViewMode;
  onOpen: (gameId: number) => void;
  onRemove: (gameId: number, gameName: string) => void;
}) {
  if (viewMode === 'list') {
    return (
      <div className="surface-panel flex flex-col gap-4 rounded-[24px] p-4 md:flex-row md:items-center">
        <button
          type="button"
          onClick={() => onOpen(game.gameId)}
          className="flex min-w-0 flex-1 items-center gap-4 text-left"
        >
          <img src={game.gameCover} alt={game.gameName} className="h-24 w-16 rounded-[16px] object-cover" />
          <div className="min-w-0 flex-1 space-y-2">
            <h3 className="text-lg font-semibold text-foreground">{game.gameName}</h3>
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Ajoute le {formatDate(game.addedAt)}
            </p>
            {game.notes ? <p className="line-clamp-2 text-sm text-foreground/85">{game.notes}</p> : null}
          </div>
        </button>
        <Button
          variant="outline"
          className="border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/15"
          onClick={() => onRemove(game.gameId, game.gameName)}
        >
          <Trash2 className="h-4 w-4" />
          Retirer
        </Button>
      </div>
    );
  }

  return (
    <div className="surface-panel overflow-hidden rounded-[24px]">
      <button type="button" className="w-full text-left" onClick={() => onOpen(game.gameId)}>
        <div className="aspect-[3/4] overflow-hidden">
          <img src={game.gameCover} alt={game.gameName} className="h-full w-full object-cover" />
        </div>
        <div className="space-y-2 p-4">
          <h3 className="line-clamp-2 text-base font-semibold text-foreground">{game.gameName}</h3>
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Ajoute le {formatDate(game.addedAt)}
          </p>
        </div>
      </button>
      <div className="border-t border-white/8 p-4 pt-0">
        <Button
          variant="ghost"
          className="mt-3 w-full justify-center text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => onRemove(game.gameId, game.gameName)}
        >
          Retirer de la liste
        </Button>
      </div>
    </div>
  );
}

export default function CollectionsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<LibraryTab>('collection');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [stats, setStats] = useState<CollectionStats>(emptyStats);
  const [collectionItems, setCollectionItems] = useState<CollectionItem[]>([]);
  const [lists, setLists] = useState<List[]>([]);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [listGames, setListGames] = useState<ListGame[]>([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(true);
  const [isLoadingListGames, setIsLoadingListGames] = useState(false);
  const [isCreateListOpen, setIsCreateListOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [isSubmittingList, setIsSubmittingList] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedList = useMemo(
    () => lists.find((list) => list.id === selectedListId) ?? null,
    [lists, selectedListId]
  );

  const filteredCollection = useMemo(() => {
    return collectionItems.filter((item) => {
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const haystack = [
        item.gameName,
        item.genre,
        item.genres?.join(' '),
        item.platform,
        item.platforms?.join(' '),
        item.notes,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return matchesStatus && haystack.includes(searchQuery.trim().toLowerCase());
    });
  }, [collectionItems, searchQuery, statusFilter]);

  const filteredListGames = useMemo(() => {
    return listGames.filter((game) => {
      const haystack = [game.gameName, game.notes].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(searchQuery.trim().toLowerCase());
    });
  }, [listGames, searchQuery]);

  const loadLibrary = async (restoreSelection = true) => {
    if (!user) {
      setCollectionItems([]);
      setStats(emptyStats);
      setLists([]);
      setSelectedListId(null);
      setIsLoadingLibrary(false);
      return;
    }

    setIsLoadingLibrary(true);
    setError(null);

    try {
      const [collectionResult, listsResult] = await Promise.all([
        getUserCollectionForStats(user.uid),
        getUserLists(user.uid),
      ]);

      if (collectionResult.error) {
        setError(collectionResult.error);
      }

      setCollectionItems(collectionResult.items);
      setStats(collectionResult.stats);
      setLists(listsResult.lists);

      if (restoreSelection) {
        const restoreListId = sessionStorage.getItem('restoreListId');
        const restoreListTab = sessionStorage.getItem('restoreListTab');

        if (restoreListTab === 'lists') {
          setActiveTab('lists');
        }

        if (restoreListId && listsResult.lists.some((list) => list.id === restoreListId)) {
          setSelectedListId(restoreListId);
        } else if (!selectedListId && listsResult.lists[0]?.id) {
          setSelectedListId(listsResult.lists[0].id);
        }

        sessionStorage.removeItem('restoreListId');
        sessionStorage.removeItem('restoreListTab');
      } else if (!selectedListId && listsResult.lists[0]?.id) {
        setSelectedListId(listsResult.lists[0].id);
      }
    } catch (loadError: any) {
      setError(loadError.message || 'Impossible de charger la bibliotheque.');
    } finally {
      setIsLoadingLibrary(false);
    }
  };

  const loadListGames = async (listId: string) => {
    if (!user) {
      return;
    }

    setIsLoadingListGames(true);
    const result = await getGamesInList(user.uid, listId, 100);
    setListGames(result.games);
    setIsLoadingListGames(false);
  };

  useEffect(() => {
    loadLibrary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (activeTab === 'lists' && selectedListId) {
      loadListGames(selectedListId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedListId, user]);

  const navigateToGame = (gameId: number, source: 'collection' | 'list') => {
    sessionStorage.removeItem('cameFromGames');
    sessionStorage.removeItem('cameFromHome');
    sessionStorage.removeItem('cameFromProfile');

    if (source === 'collection') {
      sessionStorage.setItem('cameFromCollection', 'true');
      sessionStorage.removeItem('cameFromCustomList');
    } else if (selectedListId) {
      sessionStorage.setItem('cameFromCustomList', selectedListId);
      sessionStorage.removeItem('cameFromCollection');
    }

    router.push(`/games/${gameId}`);
  };

  const handleRemoveCollectionItem = async (gameId: number, gameName: string) => {
    if (!window.confirm(`Retirer "${gameName}" de ta bibliotheque ?`)) {
      return;
    }

    const result = await removeFromCollection(gameId);
    if (result.success) {
      await loadLibrary(false);
    }
  };

  const handleRemoveListGame = async (gameId: number, gameName: string) => {
    if (!selectedListId || !window.confirm(`Retirer "${gameName}" de cette liste ?`)) {
      return;
    }

    const result = await removeGameFromList(selectedListId, gameId);
    if (result.success) {
      await loadListGames(selectedListId);
      await loadLibrary(false);
    }
  };

  const handleDeleteList = async () => {
    if (!selectedListId || !selectedList) {
      return;
    }

    if (!window.confirm(`Supprimer la liste "${selectedList.name}" ?`)) {
      return;
    }

    const result = await deleteList(selectedListId);
    if (result.success) {
      setListGames([]);
      setSelectedListId(null);
      await loadLibrary(false);
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) {
      return;
    }

    setIsSubmittingList(true);
    const result = await createList({
      name: newListName.trim(),
      description: newListDescription.trim(),
      icon: 'bookmark',
      color: '#10bfa1',
    });

    if (result.success) {
      setNewListName('');
      setNewListDescription('');
      setIsCreateListOpen(false);
      await loadLibrary(false);
      if (result.listId) {
        setSelectedListId(result.listId);
        setActiveTab('lists');
      }
    }

    setIsSubmittingList(false);
  };

  if (!loading && !user) {
    return (
      <AppShell>
        <div className="space-y-6">
          <PageIntro
            eyebrow="Bibliotheque"
            title="Une bibliotheque personnelle pour suivre vraiment tes jeux."
            description="Statuts, notes, listes custom et navigation detaillee dans une seule interface."
          />
          <EmptyState
            title="Connecte-toi pour debloquer ta bibliotheque"
            description="Tu pourras classer tes jeux, filtrer par statut, gerer des listes et retrouver rapidement tes reviews."
            actions={
              <>
                <Button onClick={() => window.dispatchEvent(new CustomEvent('openLoginModal'))}>
                  Se connecter
                </Button>
                <Button
                  variant="outline"
                  className="border-white/10 bg-white/5"
                  onClick={() => window.dispatchEvent(new CustomEvent('openRegisterModal'))}
                >
                  Creer un compte
                </Button>
              </>
            }
          />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell contentClassName="space-y-6">
      <PageIntro
        eyebrow="Library"
        title="Ta bibliotheque, structuree comme un vrai outil de pilotage."
        description="Basculer entre backlog, jeux termines, wishlist et listes custom reste instantane, avec une lecture claire en grille ou en liste."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              className={viewMode === 'grid' ? 'gap-2' : 'gap-2 border-white/10 bg-white/5'}
              onClick={() => setViewMode('grid')}
            >
              <Grid2x2 className="h-4 w-4" />
              Grille
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              className={viewMode === 'list' ? 'gap-2' : 'gap-2 border-white/10 bg-white/5'}
              onClick={() => setViewMode('list')}
            >
              <LayoutList className="h-4 w-4" />
              Liste
            </Button>
            <Button className="gap-2" onClick={() => setIsCreateListOpen(true)}>
              <Plus className="h-4 w-4" />
              Nouvelle liste
            </Button>
          </div>
        }
      >
        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-[22px] border border-white/8 bg-black/15 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Total</p>
            <p className="mt-3 text-3xl font-semibold text-foreground">{stats.total}</p>
          </div>
          <div className="rounded-[22px] border border-white/8 bg-black/15 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">En cours</p>
            <p className="mt-3 text-3xl font-semibold text-foreground">{stats.playing}</p>
          </div>
          <div className="rounded-[22px] border border-white/8 bg-black/15 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Termines</p>
            <p className="mt-3 text-3xl font-semibold text-foreground">{stats.completed}</p>
          </div>
          <div className="rounded-[22px] border border-white/8 bg-black/15 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Wishlist</p>
            <p className="mt-3 text-3xl font-semibold text-foreground">{stats.wishlist}</p>
          </div>
        </div>
      </PageIntro>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as LibraryTab)}>
        <TabsList variant="line" className="w-full justify-start gap-2 rounded-none p-0">
          <TabsTrigger value="collection" className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 data-[state=active]:border-primary/20 data-[state=active]:bg-primary/10">
            <Library className="h-4 w-4" />
            Bibliotheque
          </TabsTrigger>
          <TabsTrigger value="lists" className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 data-[state=active]:border-primary/20 data-[state=active]:bg-primary/10">
            <BookMarked className="h-4 w-4" />
            Listes perso
          </TabsTrigger>
        </TabsList>

        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative max-w-xl flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={activeTab === 'collection' ? 'Rechercher un jeu, un genre, une note...' : 'Rechercher dans la liste selectionnee...'}
              className="h-12 border-white/10 bg-black/20 pl-11"
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <TabsContent value="collection" className="space-y-5 pt-2">
          <div className="grid gap-3 md:grid-cols-5">
            {statusFilters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => setStatusFilter(filter.key)}
                className={`rounded-[22px] border px-4 py-4 text-left transition-all ${
                  statusFilter === filter.key
                    ? 'border-primary/20 bg-primary/10'
                    : 'border-white/8 bg-white/4 hover:bg-white/8'
                }`}
              >
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{filter.label}</p>
                <p className="mt-3 text-2xl font-semibold text-foreground">{filter.getValue(stats)}</p>
              </button>
            ))}
          </div>

          {isLoadingLibrary ? (
            <div className="surface-panel rounded-[28px] px-6 py-16 text-center text-muted-foreground">
              Chargement de la bibliotheque...
            </div>
          ) : filteredCollection.length > 0 ? (
            <div className={viewMode === 'grid' ? 'grid gap-4 sm:grid-cols-2 xl:grid-cols-4' : 'space-y-4'}>
              {filteredCollection.map((item) => (
                <CollectionCard
                  key={item.gameId}
                  item={item}
                  viewMode={viewMode}
                  onOpen={(gameId) => navigateToGame(gameId, 'collection')}
                  onRemove={handleRemoveCollectionItem}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Aucun jeu ne correspond"
              description="Ajuste ton filtre ou commence a alimenter ta bibliotheque depuis les fiches jeu."
            />
          )}
        </TabsContent>

        <TabsContent value="lists" className="pt-2">
          <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
            <Card className="surface-panel gap-0 rounded-[28px] border-white/8 bg-transparent py-0">
              <CardHeader className="px-5 pt-5">
                <CardTitle className="text-xl">Tes listes</CardTitle>
                <CardDescription>Collections temporaires, marathons, envies ou franchises.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 px-5 pb-5">
                {lists.length > 0 ? (
                  lists.map((list) => {
                    const isSelected = list.id === selectedListId;
                    return (
                      <button
                        key={list.id}
                        type="button"
                        onClick={() => setSelectedListId(list.id || null)}
                        className={`w-full rounded-[20px] border p-4 text-left transition-all ${
                          isSelected
                            ? 'border-primary/20 bg-primary/10'
                            : 'border-white/8 bg-white/4 hover:bg-white/8'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold text-foreground">{list.name}</p>
                          <Heart className="h-4 w-4 text-primary" />
                        </div>
                        {list.description ? (
                          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{list.description}</p>
                        ) : (
                          <p className="mt-2 text-sm text-muted-foreground">Aucune description.</p>
                        )}
                      </button>
                    );
                  })
                ) : (
                  <EmptyState
                    title="Aucune liste perso"
                    description="Cree une premiere liste pour organiser un marathon, une saga ou des envies d'achat."
                  />
                )}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card className="surface-panel gap-0 rounded-[28px] border-white/8 bg-transparent py-0">
                <CardHeader className="px-6 pt-6">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <CardTitle className="text-2xl">
                        {selectedList ? selectedList.name : 'Selectionne une liste'}
                      </CardTitle>
                      <CardDescription>
                        {selectedList?.description || 'Choisis une liste pour afficher ses jeux.'}
                      </CardDescription>
                    </div>
                    {selectedList ? (
                      <div className="flex gap-2">
                        <Button className="gap-2" onClick={() => setIsCreateListOpen(true)}>
                          <Plus className="h-4 w-4" />
                          Nouvelle liste
                        </Button>
                        <Button
                          variant="outline"
                          className="gap-2 border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/15"
                          onClick={handleDeleteList}
                        >
                          <Trash2 className="h-4 w-4" />
                          Supprimer
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  {!selectedList ? (
                    <EmptyState
                      title="Aucune liste selectionnee"
                      description="Choisis une liste dans le panneau de gauche ou cree-en une nouvelle."
                    />
                  ) : isLoadingListGames ? (
                    <div className="px-2 py-12 text-center text-muted-foreground">
                      Chargement des jeux de la liste...
                    </div>
                  ) : filteredListGames.length > 0 ? (
                    <div className={viewMode === 'grid' ? 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3' : 'space-y-4'}>
                      {filteredListGames.map((game) => (
                        <ListGameCard
                          key={game.gameId}
                          game={game}
                          viewMode={viewMode}
                          onOpen={(gameId) => navigateToGame(gameId, 'list')}
                          onRemove={handleRemoveListGame}
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      title="Liste vide"
                      description="Ajoute des jeux depuis les fiches detail ou cree une autre liste plus specialisee."
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isCreateListOpen} onOpenChange={setIsCreateListOpen}>
        <DialogContent className="border-white/10 bg-[rgba(8,14,22,0.98)] sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Nouvelle liste personnelle</DialogTitle>
            <DialogDescription>
              Cree une liste simple pour organiser tes envies, ta saga en cours ou un objectif saisonnier.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="list-name">
                Nom
              </label>
              <Input
                id="list-name"
                value={newListName}
                onChange={(event) => setNewListName(event.target.value)}
                placeholder="Ex. Marathon Soulslike"
                className="h-11 border-white/10 bg-black/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="list-description">
                Description
              </label>
              <textarea
                id="list-description"
                value={newListDescription}
                onChange={(event) => setNewListDescription(event.target.value)}
                placeholder="Optionnel"
                rows={4}
                className="flex w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-white/10 bg-white/5"
              onClick={() => setIsCreateListOpen(false)}
            >
              Annuler
            </Button>
            <Button onClick={handleCreateList} disabled={isSubmittingList || !newListName.trim()}>
              {isSubmittingList ? 'Creation...' : 'Creer la liste'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}