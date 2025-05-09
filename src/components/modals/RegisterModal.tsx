"use client";

import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import styles from '../../styles/Modal.module.css';
import { FaGoogle, FaDiscord, FaTwitter, FaEye, FaEyeSlash } from 'react-icons/fa';

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setUsername('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setError('');
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [isOpen]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation basique
    if (!username || !email || !password || !confirmPassword) {
      setError('Tous les champs sont requis');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    
    // Réinitialiser l'erreur
    setError('');
    
    // Simuler une inscription (à remplacer par une véritable inscription)
    console.log('Inscription avec:', { username, email, password });
    
    // Fermer la modale après le succès (à ajuster avec la logique d'inscription réelle)
    onClose();
  };
  
  const switchToLogin = () => {
    onClose();
    onSwitchToLogin();
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="S'inscrire">
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Nom d'utilisateur</label>
          <input
            type="text"
            className={styles.formInput}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Votre pseudo"
          />
        </div>
        
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
        
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Confirmer le mot de passe</label>
          <input
            type={showConfirmPassword ? "text" : "password"}
            className={styles.formInput}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
          />
          <button 
            type="button" 
            className={styles.passwordToggleButton}
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />} voir le mot de passe
          </button>
        </div>
        
        {error && <div className={styles.errorMessage}>{error}</div>}
        
        <button type="submit" className={styles.submit}>S'inscrire</button>
        
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
        Déjà un compte ?
        <span className={styles.switchLink} onClick={switchToLogin}>
          Se connecter
        </span>
      </div>
    </Modal>
  );
};

export default RegisterModal;
