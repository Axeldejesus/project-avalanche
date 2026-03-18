"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarDays,
  LogOut,
  Mail,
  PencilLine,
  Save,
  ShieldAlert,
  UserRound,
  X,
} from 'lucide-react';
import DeleteAccountModal from './modals/DeleteAccountModal';
import EmptyState from '@/components/EmptyState';
import PageIntro from '@/components/PageIntro';
import UserAvatar from './UserAvatar';
import UserReviews from './UserReviews';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { auth, logoutUser, updateUserProfile } from '@/services/authenticate';
import { uploadProfileImage } from '@/services/imageService';

interface ProfileContentProps {
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

export default function ProfileContent({ onShowToast }: ProfileContentProps) {
  const router = useRouter();
  const { user, userProfile, loading, refreshUserProfile } = useAuth();
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [loading, router, user]);

  useEffect(() => {
    setNewUsername(userProfile?.username ?? '');
  }, [userProfile?.username]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logoutUser();
    router.push('/');
  };

  const handleImageUpload = async (file: File) => {
    setUploadError(null);
    setUploadSuccess(null);

    if (!auth?.currentUser?.uid) {
      setUploadError('Utilisateur non authentifie.');
      return;
    }

    try {
      const result = await uploadProfileImage(auth.currentUser.uid, file);

      if (!result.success) {
        setUploadError(result.error || 'Impossible de mettre a jour l\'avatar.');
        return;
      }

      setUploadSuccess('Avatar mis a jour.');
      localStorage.setItem('profileImageUpdated', Date.now().toString());
      await refreshUserProfile();
    } catch (error: any) {
      setUploadError(error.message || 'Une erreur est survenue pendant l\'upload.');
    }
  };

  const saveUsername = async () => {
    if (!newUsername.trim() || newUsername.trim().length < 3) {
      onShowToast('Le pseudo doit contenir au moins 3 caracteres.', 'error');
      return;
    }

    if (!auth?.currentUser?.uid) {
      onShowToast('Utilisateur non authentifie.', 'error');
      return;
    }

    setIsSaving(true);

    try {
      const result = await updateUserProfile(auth.currentUser.uid, {
        username: newUsername.trim(),
      });

      if (!result.success) {
        onShowToast(result.error || 'Impossible de mettre a jour le pseudo.', 'error');
        return;
      }

      localStorage.setItem('profileUsernameUpdated', Date.now().toString());
      await refreshUserProfile();
      setIsEditingUsername(false);
      onShowToast('Pseudo mis a jour.', 'success');
    } catch (error: any) {
      onShowToast(error.message || 'Une erreur est survenue.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="surface-panel rounded-[28px] px-6 py-16 text-center text-muted-foreground">
        Chargement du profil...
      </div>
    );
  }

  if (!user || !userProfile) {
    return (
      <EmptyState
        title="Profil indisponible"
        description="Connecte-toi pour acceder a ton profil, tes reviews et tes statistiques personnelles."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Profil"
        title={`Bienvenue, ${userProfile.username}.`}
        description="Gere ton identite joueur, ton avatar et l'historique des reviews sans sortir du shell principal."
      />

      <div className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
        <Card className="surface-panel gap-0 rounded-[28px] border-white/8 bg-transparent py-0">
          <CardHeader className="px-6 pt-6">
            <CardTitle className="text-2xl">Informations du compte</CardTitle>
            <CardDescription>
              Maintiens un profil propre et coherent a travers toute l'application.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-6 pb-6">
            <div className="grid gap-5 rounded-[24px] border border-white/8 bg-white/4 p-5 md:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)]">
              <div className="space-y-4 rounded-[22px] border border-white/8 bg-black/15 p-5">
                <UserAvatar
                  username={userProfile.username}
                  imageUrl={userProfile.profileImageUrl}
                  editable={true}
                  onImageUpload={handleImageUpload}
                  size="xlarge"
                />
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Avatar public
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Utilise une image nette pour rendre tes reviews et tes listes plus identifiables partout dans l'app.
                  </p>
                </div>
                <div className="grid gap-3">
                  <div className="rounded-[18px] border border-white/8 bg-white/5 p-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Visibilite</p>
                    <p className="mt-2 text-sm font-medium text-foreground">Profil coherent sur mobile et desktop</p>
                  </div>
                  <div className="rounded-[18px] border border-white/8 bg-white/5 p-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Conseil</p>
                    <p className="mt-2 text-sm font-medium text-foreground">Clique sur l'avatar pour le modifier.</p>
                  </div>
                </div>
                {uploadError ? <p className="text-sm text-destructive">{uploadError}</p> : null}
                {uploadSuccess ? <p className="text-sm text-primary">{uploadSuccess}</p> : null}
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Pseudo</p>
                  {isEditingUsername ? (
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Input
                        value={newUsername}
                        onChange={(event) => setNewUsername(event.target.value)}
                        className="h-11 border-white/10 bg-black/20"
                        placeholder="Nouveau pseudo"
                      />
                      <div className="flex gap-2">
                        <Button onClick={saveUsername} disabled={isSaving} className="gap-2">
                          <Save className="h-4 w-4" />
                          Enregistrer
                        </Button>
                        <Button
                          variant="outline"
                          className="gap-2 border-white/10 bg-white/5"
                          onClick={() => {
                            setNewUsername(userProfile.username || '');
                            setIsEditingUsername(false);
                          }}
                        >
                          <X className="h-4 w-4" />
                          Annuler
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex min-w-[240px] items-center gap-3 rounded-2xl border border-white/8 bg-black/15 px-4 py-4">
                        <UserRound className="h-4 w-4 text-primary" />
                        <span className="text-lg font-semibold text-foreground">{userProfile.username}</span>
                      </div>
                      <Button
                        variant="outline"
                        className="gap-2 border-white/10 bg-white/5"
                        onClick={() => setIsEditingUsername(true)}
                      >
                        <PencilLine className="h-4 w-4" />
                        Modifier
                      </Button>
                    </div>
                  )}
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                  <div className="rounded-[20px] border border-white/8 bg-black/15 p-4">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      Email
                    </div>
                    <p className="mt-3 break-all text-sm text-foreground">{userProfile.email}</p>
                  </div>

                  <div className="rounded-[20px] border border-white/8 bg-black/15 p-4">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      <CalendarDays className="h-4 w-4" />
                      Membre depuis
                    </div>
                    <p className="mt-3 text-sm text-foreground">
                      {new Date(userProfile.createdAt).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 lg:grid-cols-3">
                  <div className="rounded-[18px] border border-white/8 bg-white/5 p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Etat du profil</p>
                    <p className="mt-2 text-sm font-semibold text-foreground">Pret pour publier des reviews</p>
                  </div>
                  <div className="rounded-[18px] border border-white/8 bg-white/5 p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Identite</p>
                    <p className="mt-2 text-sm font-semibold text-foreground">Pseudo et avatar synchronises</p>
                  </div>
                  <div className="rounded-[18px] border border-white/8 bg-white/5 p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Compte</p>
                    <p className="mt-2 text-sm font-semibold text-foreground">Actions sensibles regroupees ci-dessous</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Button
                variant="outline"
                className="h-12 justify-center gap-2 border-white/10 bg-white/5 text-foreground hover:bg-white/8"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                <LogOut className="h-4 w-4" />
                {isLoggingOut ? 'Deconnexion...' : 'Se deconnecter'}
              </Button>

              <Button
                variant="outline"
                className="h-12 justify-center gap-2 border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/15"
                onClick={() => setIsDeleteModalOpen(true)}
              >
                <ShieldAlert className="h-4 w-4" />
                Supprimer le compte
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="surface-panel gap-0 rounded-[28px] border-white/8 bg-transparent py-0">
          <CardHeader className="px-6 pt-6">
            <CardTitle className="text-2xl">Repere rapide</CardTitle>
            <CardDescription>
              Quelques principes pour garder un profil utile et propre dans la duree.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-6 text-sm text-muted-foreground">
            <div className="rounded-[20px] border border-white/8 bg-black/15 p-4">
              Un pseudo stable rend tes reviews plus reconnues et facilite l'identification sur mobile.
            </div>
            <div className="rounded-[20px] border border-white/8 bg-black/15 p-4">
              Un avatar clair aide a distinguer rapidement tes contributions dans les listes et reviews.
            </div>
            <div className="rounded-[20px] border border-white/8 bg-black/15 p-4">
              Pense a revoir regulierement tes reviews pour garder une bibliotheque vraiment exploitable.
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="surface-panel rounded-[28px] p-1">
        <div className="rounded-[24px] bg-black/10 p-5 md:p-6">
          <div className="mb-5 flex flex-col gap-2 border-b border-white/8 pb-4">
            <p className="text-xs uppercase tracking-[0.2em] text-primary/80">Reviews</p>
            <h2 className="text-2xl font-semibold text-foreground">Historique critique</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Retrouve tes derniers avis, navigue rapidement vers les fiches jeu et garde une presentation coherente avec le reste du profil.
            </p>
          </div>
          <UserReviews userId={auth?.currentUser?.uid || ''} />
        </div>
      </div>

      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onAccountDeleted={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
}