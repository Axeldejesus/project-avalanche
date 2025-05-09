"use client";

import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import styles from '../../styles/Modal.module.css';
import { FaGoogle, FaDiscord, FaTwitter, FaEye, FaEyeSlash } from 'react-icons/fa';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setPassword('');
      setError('');
      setShowPassword(false);
    }
  }, [isOpen]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation basique
    if (!email || !password) {
      setError('Tous les champs sont requis');
      return;
    }
    
    // Réinitialiser l'erreur
    setError('');
    
    // Simuler une connexion (à remplacer par une véritable authentification)
    console.log('Connexion avec:', { email, password });
    
    // Fermer la modale après le succès (à ajuster avec la logique d'authentification réelle)
    onClose();
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
          />
          <button 
            type="button" 
            className={styles.passwordToggleButton}
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <FaEye /> : <FaEyeSlash />} Voir le mot de passe
          </button>
        </div>
        
        {error && <div className={styles.errorMessage}>{error}</div>}
        
        <button type="submit" className={styles.submit}>Se connecter</button>
        
        <div className={styles.divider}>ou</div>
        
        <div className={styles.socialLogin}>
          <button type="button" className={styles.socialButton}>
            <FaGoogle /> Continuer avec Google
          </button>
          <button type="button" className={styles.socialButton}>
            <FaDiscord /> Continuer avec Discord
          </button>
          <button type="button" className={styles.socialButton}>
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
