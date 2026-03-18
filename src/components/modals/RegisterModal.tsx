"use client";

import React, { useState } from 'react';
import Modal from './Modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { registerUser } from '../../services/authenticate';
import { useToast } from '@/context/ToastContext';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

const RegisterModal: React.FC<RegisterModalProps> = ({ isOpen, onClose, onSwitchToLogin }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !email || !password || !confirmPassword) {
      setError('Tous les champs sont requis');
      return;
    }
    if (username.length < 3) {
      setError('Le pseudo doit contenir au moins 3 caractères');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await registerUser(email, password, username);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setTimeout(() => {
            showToast(`Bienvenue sur Avalanche, ${username} ! 🎉`, 'success');
          }, 300);
        }, 500);
      } else {
        if (result.error === 'auth/email-already-in-use') {
          setError('Cet email est déjà utilisé. Essayez de vous connecter.');
        } else if (result.error === 'auth/invalid-email') {
          setError('Adresse email invalide.');
        } else if (result.error === 'auth/weak-password') {
          setError('Mot de passe trop faible.');
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

  const PasswordToggle = ({ show, onToggle }: { show: boolean; onToggle: () => void }) => (
    <button
      type="button"
      onClick={onToggle}
      disabled={loading}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
      aria-label={show ? 'Masquer' : 'Afficher'}
    >
      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Créer un compte">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="reg-username" className="text-sm font-medium text-foreground">Pseudo</label>
          <Input
            id="reg-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="votre_pseudo"
            disabled={loading}
            className="bg-muted/50 border-border"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="reg-email" className="text-sm font-medium text-foreground">Email</label>
          <Input
            id="reg-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="votre@email.com"
            disabled={loading}
            className="bg-muted/50 border-border"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="reg-password" className="text-sm font-medium text-foreground">Mot de passe</label>
          <div className="relative">
            <Input
              id="reg-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              className="bg-muted/50 border-border pr-10"
            />
            <PasswordToggle show={showPassword} onToggle={() => setShowPassword(!showPassword)} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="reg-confirm" className="text-sm font-medium text-foreground">Confirmer le mot de passe</label>
          <div className="relative">
            <Input
              id="reg-confirm"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              className="bg-muted/50 border-border pr-10"
            />
            <PasswordToggle show={showConfirmPassword} onToggle={() => setShowConfirmPassword(!showConfirmPassword)} />
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-primary">Inscription réussie !</p>}

        <Button type="submit" disabled={loading} className="w-full gap-2">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Inscription en cours...
            </>
          ) : (
            "S'inscrire"
          )}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Déjà un compte ?{' '}
        <button
          type="button"
          onClick={() => { onClose(); onSwitchToLogin(); }}
          className="text-primary hover:underline font-medium"
        >
          Se connecter
        </button>
      </p>
    </Modal>
  );
};

export default RegisterModal;
