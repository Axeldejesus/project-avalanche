"use client";

import React, { useEffect } from 'react';
import styles from '../styles/Toast.module.css';
import { FiCheck, FiX } from 'react-icons/fi';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type = 'success', duration = 4000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className={`${styles.toast} ${styles[type]}`}>
      <div className={styles.toastIcon}>
        {type === 'success' ? <FiCheck /> : <FiX />}
      </div>
      <div className={styles.toastMessage}>{message}</div>
      <button className={styles.toastClose} onClick={onClose}>
        <FiX />
      </button>
    </div>
  );
};

export default Toast;
