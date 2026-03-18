"use client";

import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { loginUser, getUserProfile } from '../../services/authenticate';
import { useToast } from '@/context/ToastContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setPassword('');
      setError('');
      setShowPassword(false);
      setSuccess(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Tous les champs sont requis');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await loginUser(email, password);

      if (result.success) {
        setSuccess(true);
        const profileResult = await getUserProfile(result.user!.uid);
        const username = profileResult.success && profileResult.data?.username
          ? profileResult.data.username
          : result.user!.email?.split('@')[0] || 'Joueur';

        setTimeout(() => {
          onClose();
          setTimeout(() => {
            showToast(`Bon retour, ${username} ! 🎮`, 'success');
          }, 300);
        }, 500);
      } else {
        if (result.error === 'auth/user-not-found' || result.error === 'auth/wrong-password') {
          setError('Email ou mot de passe incorrect.');
        } else if (result.error === 'auth/too-many-requests') {
          setError('Trop de tentatives. Réessayez plus tard.');
        } else {
          setError('Une erreur est survenue. Réessayez.');
        }
      }
    } catch {
      setError('Une erreur inattendue est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Connexion">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Email</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="votre@email.com"
            disabled={loading}
            className="bg-muted/50 border-border"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Mot de passe</label>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              className="bg-muted/50 border-border pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-primary">Connexion réussie !</p>}

        <Button type="submit" disabled={loading} className="w-full gap-2">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Connexion en cours...
            </>
          ) : (
            'Se connecter'
          )}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Pas encore de compte ?{' '}
        <button
          type="button"
          onClick={() => { onClose(); onSwitchToRegister(); }}
          className="text-primary hover:underline font-medium"
        >
          S&apos;inscrire
        </button>
      </p>
    </Modal>
  );
};

export default LoginModal;
