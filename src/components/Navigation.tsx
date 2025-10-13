'use client';

import { useState } from 'react';
import styles from '../styles/Home.module.css';
import { FiHome, FiBarChart2, FiMenu, FiX } from 'react-icons/fi';
import { RiGamepadFill } from 'react-icons/ri';
import { BsCollectionPlay } from 'react-icons/bs';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

const Navigation: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
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
    closeMobileMenu();
    router.push('/profile');
  };
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <>
      {/* Desktop navigation */}
      <nav className={styles.nav}>
        <Link href="/" className={`${styles.navItem} ${isActive('/') ? styles.active : ''}`}>
          <FiHome className={styles.navIcon} /> <span>Home</span>
        </Link>
        <Link href="/games" className={`${styles.navItem} ${isActive('/games') ? styles.active : ''}`}>
          <RiGamepadFill className={styles.navIcon} /> <span>Games</span>
        </Link>
        <Link href="/collections" className={`${styles.navItem} ${isActive('/collections') ? styles.active : ''}`}>
          <BsCollectionPlay className={styles.navIcon} /> <span>Collections</span>
        </Link>
        <Link href="/stats" className={`${styles.navItem} ${isActive('/stats') ? styles.active : ''}`}>
          <FiBarChart2 className={styles.navIcon} /> <span>Stats</span>
        </Link>
      </nav>
      
      {/* Mobile menu button */}
      <button 
        className={styles.mobileMenuButton}
        onClick={toggleMobileMenu}
        aria-label="Toggle menu"
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
            {user && userProfile ? (
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
                  className={styles.loginBtn}
                  onClick={() => {
                    closeMobileMenu();
                    // Trigger login modal - you may need to implement this
                    window.dispatchEvent(new CustomEvent('openLoginModal'));
                  }}
                >
                  Log In
                </button>
                <button 
                  className={styles.registerBtn}
                  onClick={() => {
                    closeMobileMenu();
                    // Trigger register modal - you may need to implement this
                    window.dispatchEvent(new CustomEvent('openRegisterModal'));
                  }}
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className={styles.mobileNavItems}>
          <Link 
            href="/" 
            className={`${styles.mobileNavItem} ${isActive('/') ? styles.active : ''}`}
            onClick={closeMobileMenu}
          >
            <FiHome className={styles.navIcon} />
            <span>Home</span>
          </Link>
          <Link 
            href="/games" 
            className={`${styles.mobileNavItem} ${isActive('/games') ? styles.active : ''}`}
            onClick={closeMobileMenu}
          >
            <RiGamepadFill className={styles.navIcon} />
            <span>Games</span>
          </Link>
          <Link 
            href="/collections" 
            className={`${styles.mobileNavItem} ${isActive('/collections') ? styles.active : ''}`}
            onClick={closeMobileMenu}
          >
            <BsCollectionPlay className={styles.navIcon} />
            <span>Collections</span>
          </Link>
          <Link 
            href="/stats" 
            className={`${styles.mobileNavItem} ${isActive('/stats') ? styles.active : ''}`}
            onClick={closeMobileMenu}
          >
            <FiBarChart2 className={styles.navIcon} />
            <span>Stats</span>
          </Link>
        </div>
      </div>
    </>
  );
};

export default Navigation;
