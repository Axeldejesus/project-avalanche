"use client";

import React, { useEffect, useState } from 'react';
import {
  Check,
  Clock3,
  Gamepad2,
  Heart,
  Info,
  List,
  Loader2,
  Plus,
  RotateCcw,
  Trophy,
  Trash2,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Modal from './Modal';
import { addToCollection, getUserGameInCollection, removeFromCollection } from '../../services/collectionService';
import { addGameToList, getListsContainingGame, getUserLists, removeGameFromList } from '../../services/listService';
import { useAuth } from '../../context/AuthContext';
import { type CollectionItem, type List as UserList } from '../../schemas';

type CollectionStatus = 'completed' | 'playing' | 'toPlay' | 'abandoned' | 'wishlist';

interface AddToCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: number;
  gameName: string;
  gameCover: string;
  onCollectionUpdated?: () => void;
}

const COLLECTION_STATUSES: Array<{
  id: CollectionStatus;
  label: string;
  accent: string;
  icon: React.ReactNode;
  description: string;
}> = [
  {
    id: 'playing',
    label: 'En cours',
    accent: 'border-sky-400/25 bg-sky-400/10 text-sky-100',
    icon: <Gamepad2 className="h-4 w-4" />,
    description: 'Pour les jeux que tu lances activement en ce moment.',
  },
  {
    id: 'completed',
    label: 'Termine',
    accent: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-100',
    icon: <Trophy className="h-4 w-4" />,
    description: 'Archive propre des jeux boucles et assumes.',
  },
  {
    id: 'toPlay',
    label: 'A faire',
    accent: 'border-amber-400/25 bg-amber-400/10 text-amber-100',
    icon: <Clock3 className="h-4 w-4" />,
    description: 'Backlog organise pour les prochaines sessions.',
  },
  {
    id: 'abandoned',
    label: 'Abandonne',
    accent: 'border-rose-400/25 bg-rose-400/10 text-rose-100',
    icon: <XCircle className="h-4 w-4" />,
    description: 'Jeux laisses de cote sans brouiller le reste de la bibliotheque.',
  },
  {
    id: 'wishlist',
    label: 'Wishlist',
    accent: 'border-fuchsia-400/25 bg-fuchsia-400/10 text-fuchsia-100',
    icon: <Heart className="h-4 w-4" />,
    description: 'Titres a surveiller avant achat ou avant sortie.',
  },
];

const getStatusMeta = (status: CollectionStatus) =>
  COLLECTION_STATUSES.find((item) => item.id === status) ?? COLLECTION_STATUSES[0];

const AddToCollectionModal: React.FC<AddToCollectionModalProps> = ({
  isOpen,
  onClose,
  gameId,
  gameName,
  gameCover,
  onCollectionUpdated,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<CollectionStatus>('playing');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [existingItem, setExistingItem] = useState<CollectionItem | null>(null);
  const [activeTab, setActiveTab] = useState<'collection' | 'lists'>('collection');
  const [customLists, setCustomLists] = useState<UserList[]>([]);
  const [listsContainingGame, setListsContainingGame] = useState<UserList[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);
  const [processingListId, setProcessingListId] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!isOpen || !user) {
      return;
    }

    const loadModalData = async () => {
      const item = await getUserGameInCollection(user.uid, gameId);

      if (item) {
        setExistingItem(item);
        setSelectedStatus(item.status);
      } else {
        setExistingItem(null);
        setSelectedStatus('playing');
      }

      await loadCustomLists();
    };

    void loadModalData();
  }, [gameId, isOpen, user]);

  const loadCustomLists = async () => {
    if (!user) {
      return;
    }

    setLoadingLists(true);

    try {
      const listsResult = await getUserLists(user.uid);
      if (listsResult.error) {
        console.error('Error loading lists:', listsResult.error);
        return;
      }

      setCustomLists(listsResult.lists);

      const containingResult = await getListsContainingGame(user.uid, gameId);
      if (containingResult.error) {
        console.error('Error loading lists containing game:', containingResult.error);
        return;
      }

      setListsContainingGame(containingResult.lists);
    } catch (loadError) {
      console.error('Error loading custom lists:', loadError);
    } finally {
      setLoadingLists(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!user) {
      setError('Tu dois etre connecte pour gerer ta collection.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await addToCollection({
        userId: user.uid,
        gameId,
        gameName,
        gameCover,
        status: selectedStatus,
      });

      if (!result.success) {
        setError(result.error || 'Impossible de mettre a jour la collection.');
        return;
      }

      const updatedItem = await getUserGameInCollection(user.uid, gameId);
      setExistingItem(updatedItem);
      setSuccess(existingItem ? 'Statut mis a jour dans ta bibliotheque.' : 'Jeu ajoute a ta bibliotheque.');

      if (onCollectionUpdated) {
        onCollectionUpdated();
      }
    } catch (submitError: any) {
      console.error('Error updating collection:', submitError);
      setError(submitError.message || 'Une erreur inattendue est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveFromCollection = async (event: React.MouseEvent) => {
    event.preventDefault();

    if (!user) {
      setError('Tu dois etre connecte pour gerer ta collection.');
      return;
    }

    if (!window.confirm(`Retirer "${gameName}" de ta bibliotheque ?`)) {
      return;
    }

    setIsDeleting(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await removeFromCollection(gameId);

      if (!result.success) {
        setError(result.error || 'Impossible de retirer ce jeu de la collection.');
        return;
      }

      setExistingItem(null);
      setSelectedStatus('playing');
      setSuccess('Jeu retire de ta bibliotheque.');

      if (onCollectionUpdated) {
        onCollectionUpdated();
      }
    } catch (removeError: any) {
      console.error('Error removing from collection:', removeError);
      setError(removeError.message || 'Une erreur inattendue est survenue.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleList = async (listId: string, isInList: boolean) => {
    if (!user) {
      setError('Tu dois etre connecte pour gerer tes listes.');
      return;
    }

    setProcessingListId(listId);
    setError(null);
    setSuccess(null);

    try {
      if (isInList) {
        const result = await removeGameFromList(listId, gameId);
        if (!result.success) {
          setError(result.error || 'Impossible de retirer ce jeu de la liste.');
          return;
        }

        setListsContainingGame((previous) => previous.filter((list) => list.id !== listId));
        setSuccess('Jeu retire de la liste.');
      } else {
        const result = await addGameToList(listId, {
          gameId,
          gameName,
          gameCover,
          notes: '',
        });

        if (!result.success) {
          setError(result.error || 'Impossible d\'ajouter ce jeu a la liste.');
          return;
        }

        const addedList = customLists.find((list) => list.id === listId);
        if (addedList) {
          setListsContainingGame((previous) => [...previous, addedList]);
        }
        setSuccess('Jeu ajoute a la liste.');
      }
    } catch (listError: any) {
      console.error('Error updating list:', listError);
      setError(listError.message || 'Une erreur inattendue est survenue.');
    } finally {
      setProcessingListId(null);
    }
  };

  const isGameInList = (listId: string) => listsContainingGame.some((list) => list.id === listId);

  const selectedMeta = getStatusMeta(selectedStatus);
  const currentMeta = existingItem ? getStatusMeta(existingItem.status) : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existingItem ? 'Mettre a jour la collection' : 'Ajouter a la collection'}
      description="Un seul endroit pour placer le jeu au bon statut et l'envoyer dans tes listes perso."
      size="xl"
      className="sm:max-w-4xl"
    >
      <div className="space-y-5">
        <section className="surface-panel surface-noise relative overflow-hidden rounded-[28px] p-5">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,191,161,0.16),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(247,201,93,0.12),transparent_26%)]" />
          <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center">
            <div className="h-32 w-24 overflow-hidden rounded-[22px] border border-white/10 bg-black/20 shadow-[0_24px_50px_rgba(0,0,0,0.35)]">
              <img src={gameCover} alt={gameName} className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-primary/80">Bibliotheque</p>
                <h3 className="mt-2 text-2xl font-semibold text-foreground">{gameName}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {existingItem && currentMeta ? (
                  <span className={cn('inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium', currentMeta.accent)}>
                    {currentMeta.icon}
                    Actuellement: {currentMeta.label}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-muted-foreground">
                    <Plus className="h-3.5 w-3.5" />
                    Pas encore dans ta bibliotheque
                  </span>
                )}
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-muted-foreground">
                  <List className="h-3.5 w-3.5" />
                  {listsContainingGame.length} liste{listsContainingGame.length > 1 ? 's' : ''} liee{listsContainingGame.length > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        </section>

        {!user ? (
          <div className="rounded-[24px] border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Connecte-toi pour ajouter ce jeu a ta bibliotheque ou a tes listes.
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-2 rounded-[22px] border border-white/8 bg-black/20 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('collection')}
            className={cn(
              'flex items-center justify-center gap-2 rounded-[18px] px-4 py-3 text-sm font-medium transition-colors',
              activeTab === 'collection' ? 'bg-white text-black shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Gamepad2 className="h-4 w-4" />
            Statut
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('lists')}
            className={cn(
              'flex items-center justify-center gap-2 rounded-[18px] px-4 py-3 text-sm font-medium transition-colors',
              activeTab === 'lists' ? 'bg-white text-black shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <List className="h-4 w-4" />
            Listes perso
          </button>
        </div>

        {error ? (
          <div className="rounded-[20px] border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}
        {success ? (
          <div className="rounded-[20px] border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
            {success}
          </div>
        ) : null}

        {activeTab === 'collection' ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Choix du statut</p>
                <h4 className="mt-2 text-lg font-semibold text-foreground">Place ce jeu dans la bonne etape de ton suivi</h4>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {COLLECTION_STATUSES.map((status) => {
                  const isSelected = selectedStatus === status.id;

                  return (
                    <button
                      key={status.id}
                      type="button"
                      onClick={() => setSelectedStatus(status.id)}
                      className={cn(
                        'rounded-[22px] border p-4 text-left transition-colors',
                        isSelected
                          ? 'border-primary/30 bg-primary/10 text-foreground'
                          : 'border-white/8 bg-white/4 text-muted-foreground hover:border-white/12 hover:bg-white/8 hover:text-foreground'
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className={cn('inline-flex h-10 w-10 items-center justify-center rounded-2xl border', isSelected ? 'border-primary/30 bg-primary/15 text-primary' : 'border-white/8 bg-black/20')}>
                          {status.icon}
                        </span>
                        {isSelected ? <Check className="h-4 w-4 text-primary" /> : null}
                      </div>
                      <p className="mt-4 text-sm font-semibold">{status.label}</p>
                      <p className="mt-2 text-xs leading-5 text-muted-foreground">{status.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={cn('rounded-[22px] border px-4 py-4', selectedMeta.accent)}>
              <div className="flex items-start gap-3">
                <span className="mt-0.5">{selectedMeta.icon}</span>
                <div>
                  <p className="text-sm font-semibold">{selectedMeta.label}</p>
                  <p className="mt-1 text-sm text-current/80">{selectedMeta.description}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-white/8 pt-4 sm:flex-row sm:justify-between">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                <Info className="h-3.5 w-3.5" />
                Tu peux ajuster ce statut plus tard depuis la fiche jeu.
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                {existingItem ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2 border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/15"
                    onClick={handleRemoveFromCollection}
                    disabled={isSubmitting || isDeleting}
                  >
                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    {isDeleting ? 'Suppression...' : 'Retirer'}
                  </Button>
                ) : null}
                <Button type="submit" className="gap-2" disabled={isSubmitting || isDeleting || !user}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : existingItem ? <RotateCcw className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {isSubmitting ? 'Mise a jour...' : existingItem ? 'Mettre a jour' : 'Ajouter a la bibliotheque'}
                </Button>
              </div>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Listes personnalisees</p>
              <h4 className="mt-2 text-lg font-semibold text-foreground">Place aussi ce jeu dans tes listes thematiques</h4>
            </div>

            {loadingLists ? (
              <div className="flex flex-col items-center gap-3 rounded-[24px] border border-white/8 bg-white/4 py-12 text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                Chargement des listes...
              </div>
            ) : customLists.length === 0 ? (
              <div className="rounded-[24px] border border-white/8 bg-white/4 px-5 py-10 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/8 bg-black/20 text-muted-foreground">
                  <List className="h-5 w-5" />
                </div>
                <h5 className="mt-4 text-lg font-semibold text-foreground">Aucune liste perso</h5>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  Cree une premiere liste depuis la page Collection pour regrouper tes coups de coeur, runs coop ou objectifs de l'annee.
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {customLists.map((list) => {
                  const listId = list.id || '';
                  const inList = isGameInList(listId);
                  const isProcessing = processingListId === listId;

                  return (
                    <div
                      key={listId}
                      className={cn(
                        'flex flex-col gap-4 rounded-[22px] border p-4 md:flex-row md:items-center md:justify-between',
                        inList ? 'border-primary/25 bg-primary/10' : 'border-white/8 bg-white/4'
                      )}
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-foreground">{list.name}</p>
                          {inList ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                              <Check className="h-3 w-3" />
                              Dans la liste
                            </span>
                          ) : null}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {list.description?.trim() || 'Liste sans description pour l\'instant.'}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant={inList ? 'outline' : 'default'}
                        className={cn(
                          'gap-2 md:min-w-[156px]',
                          inList ? 'border-white/10 bg-white/5 text-foreground hover:bg-white/10' : ''
                        )}
                        onClick={() => handleToggleList(listId, inList)}
                        disabled={isProcessing || !user}
                      >
                        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : inList ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        {isProcessing ? 'Mise a jour...' : inList ? 'Retirer' : 'Ajouter'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AddToCollectionModal;
