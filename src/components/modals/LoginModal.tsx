"use client";

import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import styles from '../../styles/Modal.module.css';
import { FaGoogle, FaDiscord, FaTwitter, FaEye, FaEyeSlash, FaSpinner } from 'react-icons/fa';
import { loginUser } from '../../services/authenticate';

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
  
  // Reset form when modal closes
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
    
    // Validation
    if (!email || !password) {
      setError('Tous les champs sont requis');
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      const result = await loginUser(email, password);
      
      if (result.success) {
        console.log('Connexion réussie:', result.user);
        setSuccess(true);
        
        // Fermer la modale après un court délai
        setTimeout(() => {
          onClose();
          // Optionnel: redirection ou mise à jour de l'interface
        }, 1000);
      } else {
        // Gérer les erreurs spécifiques
        if (result.error === 'auth/user-not-found' || result.error === 'auth/wrong-password') {
          setError('Email ou mot de passe incorrect.');
        } else if (result.error === 'auth/too-many-requests') {
          setError('Trop de tentatives de connexion. Veuillez réessayer plus tard.');
        } else {
          setError('Une erreur est survenue lors de la connexion. Veuillez réessayer.');
        }
      }
    } catch (err) {
      console.error('Erreur non gérée:', err);
      setError('Une erreur inattendue s\'est produite.');
    } finally {
      setLoading(false);
    }
  };
  
  const switchToRegister = () => {
    onClose();
    onSwitchToRegister();
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Se connecter">
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Email</label>
          <input
            type="email"
            className={styles.formInput}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="votreemail@exemple.com"
            disabled={loading}
          />
        </div>
        
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Mot de passe</label>
          <input
            type={showPassword ? "text" : "password"}
            className={styles.formInput}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            disabled={loading}
          />
          <button 
            type="button" 
            className={styles.passwordToggleButton}
            onClick={() => setShowPassword(!showPassword)}
            disabled={loading}
          >
            {showPassword ? <FaEye /> : <FaEyeSlash />} Voir le mot de passe
          </button>
        </div>
        
        {error && <div className={styles.errorMessage}>{error}</div>}
        {success && <div className={styles.successMessage}>Connexion réussie! Redirection...</div>}
        
        <button type="submit" className={styles.submit} disabled={loading}>
          {loading ? (
            <>
              <FaSpinner className={styles.spinner} /> 
              Connexion en cours...
            </>
          ) : (
            "Se connecter"
          )}
        </button>
        
        <div className={styles.divider}>ou</div>
        
        <div className={styles.socialLogin}>
          <button type="button" className={styles.socialButton} disabled={loading}>
            <FaGoogle /> Continuer avec Google
          </button>
          <button type="button" className={styles.socialButton} disabled={loading}>
            <FaDiscord /> Continuer avec Discord
          </button>
          <button type="button" className={styles.socialButton} disabled={loading}>
            <FaTwitter /> Continuer avec Twitter
          </button>
        </div>
      </form>
      
      <div className={styles.switchText}>
        Pas encore de compte ?
        <span className={styles.switchLink} onClick={switchToRegister}>
          S'inscrire
        </span>
      </div>
    </Modal>
  );
};

export default LoginModal;
