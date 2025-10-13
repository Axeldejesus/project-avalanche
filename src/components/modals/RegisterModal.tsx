"use client";

import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import styles from '../../styles/Modal.module.css';
import { FaEye, FaEyeSlash, FaSpinner } from 'react-icons/fa';
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
      setError('All fields are required');
      return;
    }
    
    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    // Reset error
    setError('');
    setLoading(true);
    
    try {
      // Call our registration service
      const result = await registerUser(email, password, username);
      
      if (result.success) {
        console.log('Registration successful:', result.user);
        setSuccess(true);
        
        // Close modal after a short delay
        setTimeout(() => {
          onClose();
          // Optional: redirect or update user interface
        }, 1000);
      } else {
        // Handle specific errors
        if (result.error === 'auth/email-already-in-use') {
          setError('This email is already in use. Try logging in.');
        } else if (result.error === 'auth/invalid-email') {
          setError('Invalid email address.');
        } else if (result.error === 'auth/weak-password') {
          setError('Password is too weak.');
        } else {
          setError('An error occurred during registration. Please try again.');
        }
      }
    } catch (err) {
      console.error('Unhandled error:', err);
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };
  
  const switchToLogin = () => {
    onClose();
    onSwitchToLogin();
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Register" className={styles.authModal}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Username</label>
          <input
            type="text"
            className={styles.formInput}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Your username"
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
        
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Confirm password</label>
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
            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />} Show password
          </button>
        </div>
        
        {error && <div className={styles.errorMessage}>{error}</div>}
        {success && <div className={styles.successMessage}>Registration successful! Redirecting...</div>}
        
        <button type="submit" className={styles.submit} disabled={loading}>
          {loading ? (
            <>
              <FaSpinner className={styles.spinner} /> 
              Registering...
            </>
          ) : (
            "Register"
          )}
        </button>
      </form>
      
      <div className={styles.switchText}>
        Already have an account?{' '}
        <span className={styles.switchLink} onClick={switchToLogin}>
          Login
        </span>
      </div>
    </Modal>
  );
};

export default RegisterModal;
