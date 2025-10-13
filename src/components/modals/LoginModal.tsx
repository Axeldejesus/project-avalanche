"use client";

import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import styles from '../../styles/Modal.module.css';
import { FaEye, FaEyeSlash, FaSpinner } from 'react-icons/fa';
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
      setError('All fields are required');
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      const result = await loginUser(email, password);
      
      if (result.success) {
        console.log('Login successful:', result.user);
        setSuccess(true);
        
        // Close modal after a short delay
        setTimeout(() => {
          onClose();
          // Optional: redirect or update interface
        }, 1000);
      } else {
        // Handle specific errors
        if (result.error === 'auth/user-not-found' || result.error === 'auth/wrong-password') {
          setError('Incorrect email or password.');
        } else if (result.error === 'auth/too-many-requests') {
          setError('Too many login attempts. Please try again later.');
        } else {
          setError('An error occurred during login. Please try again.');
        }
      }
    } catch (err) {
      console.error('Unhandled error:', err);
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };
  
  const switchToRegister = () => {
    onClose();
    onSwitchToRegister();
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Login" className={styles.authModal}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Email</label>
          <input
            type="email"
            className={styles.formInput}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="youremail@example.com"
            disabled={loading}
          />
        </div>
        
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Password</label>
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
            {showPassword ? <FaEye /> : <FaEyeSlash />} Show password
          </button>
        </div>
        
        {error && <div className={styles.errorMessage}>{error}</div>}
        {success && <div className={styles.successMessage}>Login successful! Redirecting...</div>}
        
        <button type="submit" className={styles.submit} disabled={loading}>
          {loading ? (
            <>
              <FaSpinner className={styles.spinner} /> 
              Logging in...
            </>
          ) : (
            "Login"
          )}
        </button>
      </form>
      
      <div className={styles.switchText}>
        Don't have an account?{' '}
        <span className={styles.switchLink} onClick={switchToRegister}>
          Register
        </span>
      </div>
    </Modal>
  );
};

export default LoginModal;
