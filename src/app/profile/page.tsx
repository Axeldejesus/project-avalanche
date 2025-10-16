"use client";

import styles from '../../styles/Home.module.css';
import profileStyles from '../../styles/Profile.module.css';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import ProfileContent from '../../components/ProfileContent';
import { useState } from 'react';
import Toast from '@/components/Toast';

export default function ProfilePage() {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  const hideToast = () => {
    setToast(null);
  };

  return (
    <div className={styles.container}>
      <Header />

      <div className={styles.mainLayout}>
        <Sidebar />
        
        <main className={styles.main}>
          <ProfileContent onShowToast={showToast} />
        </main>
      </div>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </div>
  );
}
