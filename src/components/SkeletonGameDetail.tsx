'use client';

import styles from '../styles/GameDetail.module.css';

export default function SkeletonGameDetail() {
  return (
    <div className={styles.gameDetailContainer}>
      <div className={styles.topBar}>
        <div className={`${styles.backButton} skeleton`} style={{ width: '120px', height: '20px' }}></div>
        {/* Hide the search bar in skeleton state */}
        <div className={styles.searchBarContainer} style={{ visibility: 'hidden', width: '300px' }}></div>
      </div>
      
      <div className={styles.gameHeader}>
        <div className={styles.coverWrapper} style={{ backgroundColor: '#2a2a2a' }}></div>
        
        <div className={styles.gameHeaderInfo}>
          <div className="skeleton" style={{ height: '40px', width: '80%', marginBottom: '20px' }}></div>
          
          <div className={styles.gameMeta}>
            <div className="skeleton" style={{ height: '20px', width: '60%', marginBottom: '12px' }}></div>
            
            <div className={styles.gameRatingBlock}>
              <div className="skeleton" style={{ height: '30px', width: '120px', borderRadius: '30px' }}></div>
            </div>
          </div>
          
          <div className={styles.gameActions}>
            <div className="skeleton" style={{ height: '40px', width: '180px', borderRadius: '8px' }}></div>
          </div>
          
          <div className="skeleton" style={{ height: '20px', width: '70%', marginTop: '16px', marginBottom: '12px' }}></div>
          <div className="skeleton" style={{ height: '20px', width: '65%', marginBottom: '12px' }}></div>
          <div className="skeleton" style={{ height: '20px', width: '75%', marginBottom: '12px' }}></div>
        </div>
      </div>
      
      <div className={styles.gameContent}>
        <div className={styles.gameMainContent}>
          <section className={styles.gameSummary}>
            <div className="skeleton" style={{ height: '30px', width: '150px', marginBottom: '20px' }}></div>
            <div className="skeleton" style={{ height: '18px', width: '100%', marginBottom: '10px' }}></div>
            <div className="skeleton" style={{ height: '18px', width: '100%', marginBottom: '10px' }}></div>
            <div className="skeleton" style={{ height: '18px', width: '90%', marginBottom: '10px' }}></div>
            <div className="skeleton" style={{ height: '18px', width: '95%', marginBottom: '10px' }}></div>
          </section>
          
          <div className="skeleton" style={{ height: '30px', width: '150px', marginTop: '40px', marginBottom: '20px' }}></div>
          <div className={styles.screenshotsGrid}>
            <div className="skeleton" style={{ height: '180px', borderRadius: '8px' }}></div>
            <div className="skeleton" style={{ height: '180px', borderRadius: '8px' }}></div>
          </div>
        </div>
        
        <aside className={styles.gameSidebar}>
          <div className={styles.sidebarSection}>
            <div className="skeleton" style={{ height: '24px', width: '120px', marginBottom: '16px' }}></div>
            <div className="skeleton" style={{ height: '16px', width: '90%', marginBottom: '8px' }}></div>
            <div className="skeleton" style={{ height: '16px', width: '80%', marginBottom: '8px' }}></div>
          </div>
          
          <div className={styles.sidebarSection}>
            <div className="skeleton" style={{ height: '24px', width: '150px', marginBottom: '16px' }}></div>
            <div className="skeleton" style={{ height: '16px', width: '100%', marginBottom: '8px' }}></div>
            <div className="skeleton" style={{ height: '16px', width: '100%', marginBottom: '8px' }}></div>
            <div className="skeleton" style={{ height: '16px', width: '90%', marginBottom: '8px' }}></div>
          </div>
        </aside>
      </div>
    </div>
  );
}
