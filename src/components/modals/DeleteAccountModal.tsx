"use client";

import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { deleteUserAccount } from '../../services/authenticate';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountDeleted: () => void;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isOpen,
  onClose,
  onAccountDeleted,
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setConfirmText('');
      setPassword('');
      setError('');
    }
  }, [isOpen]);

  const isDeleteEnabled = confirmText.toLowerCase() === 'supprimer' && password.length >= 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDeleteEnabled) return;

    setError('');
    setLoading(true);

    try {
      const result = await deleteUserAccount(password);

      if (result.success) {
        onClose();
        const loadingScreen = document.createElement('div');
        Object.assign(loadingScreen.style, {
          position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
          backgroundColor: '#0b0c14', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', zIndex: '9999',
          color: 'white', fontSize: '16px', fontFamily: 'var(--font-space-grotesk), sans-serif',
        });
        const spinner = document.createElement('div');
        Object.assign(spinner.style, {
          border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid #ef4444',
          borderRadius: '50%', width: '44px', height: '44px',
          animation: 'spin 0.8s linear infinite', marginBottom: '16px',
        });
        const styleEl = document.createElement('style');
        styleEl.textContent = '@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}';
        document.head.appendChild(styleEl);
        const msg = document.createElement('p');
        msg.textContent = 'Suppression en cours...';
        loadingScreen.appendChild(spinner);
        loadingScreen.appendChild(msg);
        document.body.appendChild(loadingScreen);

        setTimeout(() => { window.location.href = '/'; }, 300);
      } else {
        setError(result.error || 'Une erreur est survenue');
      }
    } catch {
      setError('Une erreur inattendue est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Supprimer mon compte"
      description="Cette action est irréversible."
    >
      <div className="flex flex-col gap-4">
        {/* Warning box */}
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-destructive mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-destructive">Action irréversible</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              La suppression de votre compte effacera définitivement votre profil,
              vos collections et toutes vos données.
            </p>
          </div>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
              Tapez <span className="text-destructive font-mono">&quot;supprimer&quot;</span> pour confirmer
            </label>
            <Input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="supprimer"
              disabled={loading}
              className="bg-muted/50 border-border"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Mot de passe actuel</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              className="bg-muted/50 border-border"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            type="submit"
            variant="destructive"
            disabled={loading || !isDeleteEnabled}
            className="w-full gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Suppression...
              </>
            ) : (
              'Supprimer définitivement mon compte'
            )}
          </Button>
        </form>
      </div>
    </Modal>
  );
};

export default DeleteAccountModal;
