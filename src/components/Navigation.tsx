'use client';

import { useState, useEffect } from 'react';
import styles from '../styles/Home.module.css';
import { FiHome, FiBarChart2, FiMenu, FiX } from 'react-icons/fi';
import { RiGamepadFill } from 'react-icons/ri';
import { BsCollectionPlay } from 'react-icons/bs';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import PageLoader from './PageLoader';

const Navigation: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, userProfile, loading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  
  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname?.startsWith(path)) return true;
    return false;
  };
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };
  
  const handleProfileClick = () => {
    if (pathname === '/profile') {
      closeMobileMenu();
      return; // Already on profile page
    }
    
    setIsNavigating(true);
    closeMobileMenu();
    
    setTimeout(() => {
      router.push('/profile');
    }, 100);
  };
  
  const handleLoginClick = () => {
    closeMobileMenu();
    const event = new CustomEvent('openLoginModal');
    window.dispatchEvent(event);
  };
  
  const handleRegisterClick = () => {
    closeMobileMenu();
    const event = new CustomEvent('openRegisterModal');
    window.dispatchEvent(event);
  };
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleNavigation = (path: string, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
    }
    
    // Don't navigate if already on the page
    if (pathname === path) {
      closeMobileMenu();
      return;
    }
    
    setIsNavigating(true);
    closeMobileMenu();
    
    // Use setTimeout to ensure the loader is visible
    setTimeout(() => {
      router.push(path);
    }, 100);
  };
  
  // Reset navigation state when pathname changes
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  return (
    <>
      {/* Desktop navigation */}
      <nav className={styles.nav}>
        <a 
          href="/" 
          className={`${styles.navItem} ${isActive('/') ? styles.active : ''}`}
          onClick={(e) => handleNavigation('/', e)}
        >
          <FiHome className={styles.navIcon} /> <span>Home</span>
        </a>
        <a 
          href="/games" 
          className={`${styles.navItem} ${isActive('/games') ? styles.active : ''}`}
          onClick={(e) => handleNavigation('/games', e)}
        >
          <RiGamepadFill className={styles.navIcon} /> <span>Games</span>
        </a>
        <a 
          href="/collections" 
          className={`${styles.navItem} ${isActive('/collections') ? styles.active : ''}`}
          onClick={(e) => handleNavigation('/collections', e)}
        >
          <BsCollectionPlay className={styles.navIcon} /> <span>Collections</span>
        </a>
        <a 
          href="/stats" 
          className={`${styles.navItem} ${isActive('/stats') ? styles.active : ''}`}
          onClick={(e) => handleNavigation('/stats', e)}
        >
          <FiBarChart2 className={styles.navIcon} /> <span>Stats</span>
        </a>
      </nav>
      
      {/* Mobile menu button - Always visible, no conditional rendering */}
      <button 
        className={styles.mobileMenuButton}
        onClick={toggleMobileMenu}
        aria-label="Toggle menu"
        style={{ visibility: 'visible' }} /* Force visibility */
      >
        <FiMenu />
      </button>
      
      {/* Mobile menu overlay */}
      <div 
        className={`${styles.mobileMenuOverlay} ${isMobileMenuOpen ? styles.open : ''}`}
        onClick={closeMobileMenu}
      />
      
      {/* Mobile navigation drawer */}
      <div className={`${styles.mobileNav} ${isMobileMenuOpen ? styles.open : ''}`}>
        <div className={styles.mobileNavHeader}>
          <div className={styles.mobileNavHeaderTop}>
            <button 
              className={styles.mobileCloseButton}
              onClick={closeMobileMenu}
              aria-label="Close menu"
            >
              <FiX />
            </button>
          </div>
          
          {/* Profile section in mobile menu */}
          <div className={styles.mobileNavProfile}>
            {loading ? (
              <div className={styles.authLoading}></div>
            ) : user && userProfile ? (
              <>
                <button 
                  className={styles.mobileNavProfileButton}
                  onClick={handleProfileClick}
                  aria-label="Go to profile"
                >
                  {userProfile.profileImageUrl ? (
                    <img 
                      src={userProfile.profileImageUrl} 
                      alt={userProfile.username} 
                      className={styles.mobileNavProfileAvatar}
                    />
                  ) : (
                    getInitials(userProfile.username || user.email || 'User')
                  )}
                </button>
                <div className={styles.mobileNavUsername}>
                  {userProfile.username || user.email?.split('@')[0] || 'User'}
                </div>
              </>
            ) : (
              <div className={styles.mobileNavAuthButtons}>
                <button 
                  className={styles.mobileLoginBtn}
                  onClick={handleLoginClick}
                >
                  Log In
                </button>
                <button 
                  className={styles.mobileRegisterBtn}
                  onClick={handleRegisterClick}
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className={styles.mobileNavItems}>
          <a 
            href="/" 
            className={`${styles.mobileNavItem} ${isActive('/') ? styles.active : ''}`}
            onClick={(e) => handleNavigation('/', e)}
          >
            <FiHome className={styles.navIcon} />
            <span>Home</span>
          </a>
          <a 
            href="/games" 
            className={`${styles.mobileNavItem} ${isActive('/games') ? styles.active : ''}`}
            onClick={(e) => handleNavigation('/games', e)}
          >
            <RiGamepadFill className={styles.navIcon} />
            <span>Games</span>
          </a>
          <a 
            href="/collections" 
            className={`${styles.mobileNavItem} ${isActive('/collections') ? styles.active : ''}`}
            onClick={(e) => handleNavigation('/collections', e)}
          >
            <BsCollectionPlay className={styles.navIcon} />
            <span>Collections</span>
          </a>
          <a 
            href="/stats" 
            className={`${styles.mobileNavItem} ${isActive('/stats') ? styles.active : ''}`}
            onClick={(e) => handleNavigation('/stats', e)}
          >
            <FiBarChart2 className={styles.navIcon} />
            <span>Stats</span>
          </a>
        </div>
      </div>
      
      {/* Page loader - render at the end to ensure it's on top */}
      {isNavigating && <PageLoader />}
    </>
  );
};

export default Navigation;
