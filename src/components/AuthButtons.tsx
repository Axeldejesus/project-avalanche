"use client";

import React, { useState, useEffect } from 'react';
import styles from '../styles/Home.module.css';
import LoginModal from './modals/LoginModal';
import RegisterModal from './modals/RegisterModal';

const AuthButtons: React.FC = () => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Only render after component is mounted on client
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const openLoginModal = () => {
    setIsLoginModalOpen(true);
    setIsRegisterModalOpen(false);
  };
  
  const openRegisterModal = () => {
    setIsRegisterModalOpen(true);
    setIsLoginModalOpen(false);
  };
  
  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
  };
  
  const closeRegisterModal = () => {
    setIsRegisterModalOpen(false);
  };
  
  // Don't render anything on the server
  if (!mounted) {
    return null;
  }
  
  return (
    <>
      <div className={styles.userMenu}>
        <button className={styles.loginBtn} onClick={openLoginModal}>
          Se connecter
        </button>
        <button className={styles.registerBtn} onClick={openRegisterModal}>
          S'inscrire
        </button>
      </div>
      
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={closeLoginModal} 
        onSwitchToRegister={openRegisterModal} 
      />
      
      <RegisterModal 
        isOpen={isRegisterModalOpen} 
        onClose={closeRegisterModal} 
        onSwitchToLogin={openLoginModal} 
      />
    </>
  );
};

export default AuthButtons;
