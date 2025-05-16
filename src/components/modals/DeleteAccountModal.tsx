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
        setError(result.error || 'An error occurred');
      }
    } catch (err) {
      console.error('Unhandled error:', err);
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Delete My Account"
      className={styles.deleteAccountModal}
    >
      <div className={deleteStyles.warningContainer}>
        <FaExclamationTriangle className={deleteStyles.warningIcon} />
        <h3 className={deleteStyles.warningTitle}>This action is irreversible</h3>
        <p className={deleteStyles.warningText}>
          Deleting your account will permanently remove all your data, including your profile, 
          preferences, and history.
        </p>
      </div>
      
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={`${styles.formGroup} ${deleteStyles.formGroup}`}>
          <label className={styles.formLabel}>
            To confirm, type "delete" below
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
        
        <div className={`${styles.formGroup} ${deleteStyles.formGroup}`}>
          <label className={styles.formLabel}>
            Enter your password to confirm
          </label>
          <input
            type="password"
            className={styles.formInput}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
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
              Deleting...
            </>
          ) : (
            "Permanently Delete My Account"
          )}
        </button>
      </form>
    </Modal>
  );
};

export default DeleteAccountModal;
