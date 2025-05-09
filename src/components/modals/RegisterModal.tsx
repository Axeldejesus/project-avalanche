"use client";

import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import styles from '../../styles/Modal.module.css';
import { FaGoogle, FaDiscord, FaTwitter, FaEye, FaEyeSlash, FaSpinner } from 'react-icons/fa';
import { registerUser } from '../../services/authenticate';

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
      setSuccess(false);
    }
  }, [isOpen]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!username || !email || !password || !confirmPassword) {
      setError('Tous les champs sont requis');
      return;
    }
    
    if (username.length < 3) {
      setError('Le nom d\'utilisateur doit contenir au moins 3 caractères');
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
    
    // Réinitialiser l'erreur
    setError('');
    setLoading(true);
    
    try {
      // Appel à notre service d'inscription
      const result = await registerUser(email, password, username);
      
      if (result.success) {
        console.log('Inscription réussie:', result.user);
        setSuccess(true);
        
        // Fermer la modale après un court délai
        setTimeout(() => {
          onClose();
          // Optionnel: redirection ou mise à jour de l'interface utilisateur
        }, 1000);
      } else {
        // Gérer les erreurs spécifiques
        if (result.error === 'auth/email-already-in-use') {
          setError('Cet email est déjà utilisé. Essayez de vous connecter.');
        } else if (result.error === 'auth/invalid-email') {
          setError('Adresse email invalide.');
        } else if (result.error === 'auth/weak-password') {
          setError('Le mot de passe est trop faible.');
        } else {
          setError('Une erreur est survenue lors de l\'inscription. Veuillez réessayer.');
        }
      }
    } catch (err) {
      console.error('Erreur non gérée:', err);
      setError('Une erreur inattendue s\'est produite.');
    } finally {
      setLoading(false);
    }
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
            disabled={loading}
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
        
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Confirmer le mot de passe</label>
          <input
            type={showConfirmPassword ? "text" : "password"}
            className={styles.formInput}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            disabled={loading}
          />
          <button 
            type="button" 
            className={styles.passwordToggleButton}
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            disabled={loading}
          >
            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />} voir le mot de passe
          </button>
        </div>
        
        {error && <div className={styles.errorMessage}>{error}</div>}
        {success && <div className={styles.successMessage}>Inscription réussie! Redirection...</div>}
        
        <button type="submit" className={styles.submit} disabled={loading}>
          {loading ? (
            <>
              <FaSpinner className={styles.spinner} /> 
              Inscription en cours...
            </>
          ) : (
            "S'inscrire"
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
        Déjà un compte ?
        <span className={styles.switchLink} onClick={switchToLogin}>
          Se connecter
        </span>
      </div>
    </Modal>
  );
};

export default RegisterModal;
