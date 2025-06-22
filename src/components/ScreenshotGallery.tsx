'use client';

import { useState, useEffect } from 'react';
import styles from '../styles/GameDetail.module.css';

interface ScreenshotGalleryProps {
  screenshots: string[];
  gameName: string;
}

export default function ScreenshotGallery({ screenshots, gameName }: ScreenshotGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  
  // Function to handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeIndex === null) return;
      
      if (e.key === 'Escape') {
        setActiveIndex(null);
      } else if (e.key === 'ArrowRight') {
        setActiveIndex((prev) => (prev === null || prev === screenshots.length - 1) ? 0 : prev + 1);
      } else if (e.key === 'ArrowLeft') {
        setActiveIndex((prev) => (prev === null || prev === 0) ? screenshots.length - 1 : prev - 1);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    // If modal is open, prevent body scrolling
    if (activeIndex !== null) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [activeIndex, screenshots.length]);
  
  // Close if clicked outside of image
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setActiveIndex(null);
    }
  };
  
  return (
    <>
      <div className={styles.screenshotsGrid}>
        {screenshots.map((screenshot, index) => (
          <div 
            key={`${screenshot}-${index}`} 
            className={styles.screenshotWrapper}
            onClick={() => setActiveIndex(index)}
          >
            <img 
              src={screenshot} 
              alt={`${gameName} screenshot ${index + 1}`} 
              className={styles.screenshot} 
            />
          </div>
        ))}
      </div>
      
      <div 
        className={`${styles.screenshotOverlay} ${activeIndex !== null ? styles.active : ''}`}
        onClick={handleOverlayClick}
      >
        {activeIndex !== null && (
          <div className={styles.screenshotModal}>
            <button 
              className={styles.screenshotClose}
              onClick={() => setActiveIndex(null)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            
            <button 
              className={`${styles.screenshotNav} ${styles.screenshotPrev}`}
              onClick={(e) => {
                e.stopPropagation();
                setActiveIndex((prev) => (prev === null || prev === 0) ? screenshots.length - 1 : prev - 1);
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            
            <img 
              src={screenshots[activeIndex]} 
              alt={`${gameName} screenshot fullsize`} 
              className={styles.screenshotFullImage} 
            />
            
            <button 
              className={`${styles.screenshotNav} ${styles.screenshotNext}`}
              onClick={(e) => {
                e.stopPropagation();
                setActiveIndex((prev) => (prev === null || prev === screenshots.length - 1) ? 0 : prev + 1);
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            
            <div className={styles.screenshotCounter}>
              {activeIndex + 1} / {screenshots.length}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
