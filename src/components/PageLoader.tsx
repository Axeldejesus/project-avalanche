'use client';

import React from 'react';
import styles from '../styles/PageLoader.module.css';

const PageLoader: React.FC = () => {
  return (
    <div className={styles.pageLoaderOverlay}>
      <div className={styles.pageLoaderContent}>
        <div className={styles.spinner}></div>
        <p className={styles.loadingText}>Loading...</p>
      </div>
    </div>
  );
};

export default PageLoader;
