"use client";

import React, { useState } from 'react';
import styles from '../styles/Home.module.css';
import LoginModal from './modals/LoginModal';
import RegisterModal from './modals/RegisterModal';

const AuthButtons: React.FC = () => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  
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
