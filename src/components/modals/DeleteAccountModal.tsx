"use client";

import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import styles from '../../styles/Modal.module.css';
import deleteStyles from '../../styles/DeleteAccountModal.module.css';
import { FaExclamationTriangle, FaSpinner } from 'react-icons/fa';
import { deleteUserAccount } from '../../services/authenticate';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountDeleted: () => void;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ 
  isOpen, 
  onClose, 
  onAccountDeleted 
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setConfirmText('');
      setPassword('');
      setError('');
    }
  }, [isOpen]);
  
  const isDeleteEnabled = confirmText.toLowerCase() === 'delete' && password.length >= 6;
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isDeleteEnabled) return;
    
    setError('');
    setLoading(true);
    
    try {
      const result = await deleteUserAccount(password);
      
      if (result.success) {
        onAccountDeleted();
      } else {
        setError(result.error || 'Une erreur est survenue');
      }
    } catch (err) {
      console.error('Erreur non gérée:', err);
      setError('Une erreur inattendue s\'est produite.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Supprimer mon compte">
      <div className={deleteStyles.warningContainer}>
        <FaExclamationTriangle className={deleteStyles.warningIcon} />
        <h3 className={deleteStyles.warningTitle}>Cette action est irréversible</h3>
        <p className={deleteStyles.warningText}>
          La suppression de votre compte entraînera la perte définitive de toutes vos données, y compris votre profil, 
          vos préférences et votre historique.
        </p>
      </div>
      
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            Pour confirmer, tapez "delete" ci-dessous
          </label>
          <input
            type="text"
            className={styles.formInput}
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="delete"
            disabled={loading}
          />
        </div>
        
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            Entrez votre mot de passe pour confirmer
          </label>
          <input
            type="password"
            className={styles.formInput}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Votre mot de passe"
            disabled={loading}
          />
        </div>
        
        {error && <div className={styles.errorMessage}>{error}</div>}
        
        <button 
          type="submit" 
          className={`${deleteStyles.deleteButton} ${!isDeleteEnabled ? deleteStyles.deleteButtonDisabled : ''}`}
          disabled={loading || !isDeleteEnabled}
        >
          {loading ? (
            <>
              <FaSpinner className={styles.spinner} /> 
              Suppression en cours...
            </>
          ) : (
            "Supprimer définitivement mon compte"
          )}
        </button>
      </form>
    </Modal>
  );
};

export default DeleteAccountModal;
