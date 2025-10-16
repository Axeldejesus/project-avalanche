'use client';

import React, { useRef, useState } from 'react';
import { useEffect } from 'react';
import Link from 'next/link';
import { FiCalendar, FiUsers, FiArrowLeft, FiMessageSquare, FiBookmark, FiSearch, FiMenu, FiX, FiHome, FiBarChart2 } from 'react-icons/fi';
import { RiGamepadFill } from 'react-icons/ri';
import { BsCollectionPlay } from 'react-icons/bs';
import { motion } from 'framer-motion';
import styles from './gameDetail.module.css';
import { Button } from '@/components/ui/button';
import GameVideosWrapper from '@/components/GameVideosWrapper';
import ScreenshotGallery from '@/components/ScreenshotGallery';
import BackButton from '@/components/BackButton';
import SearchBar from '@/components/SearchBar';
import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import AddToCollectionModal from '@/components/modals/AddToCollectionModal';
import LoginModal from '@/components/modals/LoginModal';
import RegisterModal from '@/components/modals/RegisterModal';
import { getUserGameInCollection } from '@/services/collectionService';

// Dynamically load review components to improve initial page performance
const DynamicReviewForm = dynamic(() => import('@/components/ReviewForm'), {
  loading: () => <div className={styles.reviewLoading}>Loading review form...</div>,
  ssr: false
});

const DynamicReviewsList = dynamic(() => import('@/components/ReviewsList'), {
  loading: () => <div className={styles.reviewLoading}>Loading reviews...</div>,
  ssr: false
});

interface Developer {
  name: string;
}

interface Publisher {
  name: string;
}

interface ReleaseDate {
  date: number;
  platform: string;
}

interface Screenshot {
  id: string;
  url: string;
}

interface SimilarGame {
  id: number;
  name: string;
  cover: string;
}

interface GameDetail {
  id: number;
  name: string;
  summary: string;
  storyline?: string;
  cover: string;
  screenshots: string[];
  genres: string[];
  platforms: string[];
  developers: string[];
  publishers: string[];
  releaseDates: ReleaseDate[];
  similarGames: SimilarGame[];
}

// Helper to format date
function formatReleaseDate(timestamp: number): string {
  if (!timestamp || isNaN(timestamp)) {
    return 'Unknown date';
  }
  
  try {
    const date = new Date(timestamp * 1000);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Unknown date';
    }
    
    const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' };
    return new Intl.DateTimeFormat('en-US', options).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Unknown date';
  }
}

export default function GameDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Properly unwrap the params Promise using React.use()
  const unwrappedParams = React.use(params);
  const id = unwrappedParams.id;

  const [gameDetail, setGameDetail] = useState<GameDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshReviews, setRefreshReviews] = useState<number>(0);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [collectionStatus, setCollectionStatus] = useState<string | null>(null);
  const { user, userProfile } = useAuth();
  const pathname = usePathname();
  const routerNav = useRouter();
  
  // Add ref for scrolling to reviews section
  const reviewsRef = useRef<HTMLDivElement>(null);
  
  // Scroll to reviews section function
  const scrollToReviews = () => {
    reviewsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopMenuOpen, setIsDesktopMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  useEffect(() => {
    const fetchGameDetail = async () => {
      try {
        const res = await fetch(`/api/games/${id}`);
        
        if (!res.ok) {
          throw new Error('Failed to fetch game details');
        }
        
        const data = await res.json();
        setGameDetail(data);
      } catch (error) {
        console.error('Error fetching game details:', error);
        setError('Could not load game details');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchGameDetail();
  }, [id]);
  
  // Check if game is in user's collection
  useEffect(() => {
    const checkCollection = async () => {
      if (user && gameDetail) {
        const collectionItem = await getUserGameInCollection(user.uid, parseInt(id));
        if (collectionItem) {
          setCollectionStatus(collectionItem.status);
        } else {
          setCollectionStatus(null);
        }
      }
    };
    
    if (!isLoading && gameDetail) {
      checkCollection();
    }
  }, [user, id, gameDetail, isLoading]);
  
  // Handle review submission
  const handleReviewSubmitted = () => {
    setRefreshReviews(prev => prev + 1);
  };
  
  // Handle opening the collection modal
  const openCollectionModal = () => {
    setIsCollectionModalOpen(true);
  };
  
  // Handle collection updates
  const handleCollectionUpdated = async () => {
    if (user) {
      const collectionItem = await getUserGameInCollection(user.uid, parseInt(id));
      if (collectionItem) {
        setCollectionStatus(collectionItem.status);
      } else {
        setCollectionStatus(null);
      }
    }
  };
  
  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Ne pas fermer si on clique sur le bouton toggle lui-même
      if (isSearchOpen && !target.closest(`.${styles.mobileSearchContainer}`) && !target.closest(`.${styles.mobileSearchToggle}`)) {
        setIsSearchOpen(false);
      }
      if (isMobileMenuOpen && !target.closest(`.${styles.mobileNav}`) && !target.closest(`.${styles.mobileMenuToggle}`)) {
        setIsMobileMenuOpen(false);
      }
      if (isDesktopMenuOpen && !target.closest(`.${styles.desktopNavMenu}`) && !target.closest(`.${styles.desktopMenuToggle}`)) {
        setIsDesktopMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSearchOpen, isMobileMenuOpen, isDesktopMenuOpen]);
  
  // Toggle search on mobile
  const toggleSearch = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSearchOpen(!isSearchOpen);
  };
  
  // Toggle mobile menu
  const toggleMobileMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  // Toggle desktop menu
  const toggleDesktopMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDesktopMenuOpen(!isDesktopMenuOpen);
  };

  // Close mobile menu
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };
  
  // Close desktop menu
  const closeDesktopMenu = () => {
    setIsDesktopMenuOpen(false);
  };

  // Handle navigation
  const handleNavigation = (path: string, event: React.MouseEvent) => {
    event.preventDefault();
    if (pathname === path) {
      closeMobileMenu();
      return;
    }
    closeMobileMenu();
    routerNav.push(path);
  };
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  const handleProfileClick = () => {
    if (pathname === '/profile') {
      closeMobileMenu();
      return;
    }
    closeMobileMenu();
    routerNav.push('/profile');
  };
  
  const handleLoginClick = () => {
    closeMobileMenu();
    closeDesktopMenu();
    setIsLoginModalOpen(true);
    setIsRegisterModalOpen(false);
  };
  
  const handleRegisterClick = () => {
    closeMobileMenu();
    closeDesktopMenu();
    setIsRegisterModalOpen(true);
    setIsLoginModalOpen(false);
  };
  
  // Add event listeners for opening modals
  useEffect(() => {
    const handleOpenLoginModal = () => {
      console.log('openLoginModal event received in game detail');
      setIsLoginModalOpen(true);
      setIsRegisterModalOpen(false);
    };
    
    const handleOpenRegisterModal = () => {
      console.log('openRegisterModal event received in game detail');
      setIsRegisterModalOpen(true);
      setIsLoginModalOpen(false);
    };
    
    window.addEventListener('openLoginModal', handleOpenLoginModal as EventListener);
    window.addEventListener('openRegisterModal', handleOpenRegisterModal as EventListener);
    
    return () => {
      window.removeEventListener('openLoginModal', handleOpenLoginModal as EventListener);
      window.removeEventListener('openRegisterModal', handleOpenRegisterModal as EventListener);
    };
  }, []);

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname?.startsWith(path)) return true;
    return false;
  };

  if (isLoading) {
    return (
      <div className={styles.loaderContainer}>
        <div className={styles.gameLoader}>
          <div className={styles.loaderBar}></div>
        </div>
        <p>Loading game details...</p>
      </div>
    );
  }
  
  if (error || !gameDetail) {
    return (
      <div className={styles.errorContainer}>
        <h1>Game Not Found</h1>
        <p>The game you're looking for doesn't exist or there was an error.</p>
        <Link href="/games" className={styles.backLink}>
          <FiArrowLeft className={styles.backIcon} /> Return to Games
        </Link>
      </div>
    );
  }
  
  // Find the earliest release date
  const earliestRelease = gameDetail.releaseDates.length > 0 
    ? gameDetail.releaseDates.reduce((earliest, current) => 
        current.date < earliest.date ? current : earliest, 
        gameDetail.releaseDates[0]
      ) 
    : null;
    
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2 
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };
  
  return (
    <motion.div 
      className={styles.container}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Hero Header with Game Screenshot as Background */}
      <div 
        className={styles.heroHeader}
        style={{ 
          backgroundImage: `url(${gameDetail.screenshots && gameDetail.screenshots.length > 0 
            ? gameDetail.screenshots[0] 
            : gameDetail.cover})` 
        }}
      >
        <div className={styles.heroOverlay}>
          <div className={styles.topBar}>
            <div className={styles.backButtonWrapper}>
              <BackButton />
              <button 
                className={styles.desktopMenuToggle}
                onClick={toggleDesktopMenu}
                aria-label="Toggle navigation menu"
              >
                <FiMenu size={20} />
              </button>
            </div>
            
            {/* Desktop navigation menu */}
            {isDesktopMenuOpen && (
              <div className={styles.desktopNavMenu}>
                <div className={styles.desktopNavHeader}>
                  {user && userProfile ? (
                    <>
                      <button 
                        className={styles.desktopNavProfileButton}
                        onClick={handleProfileClick}
                        aria-label="Go to profile"
                      >
                        {userProfile.profileImageUrl ? (
                          <img 
                            src={userProfile.profileImageUrl} 
                            alt={userProfile.username} 
                            className={styles.desktopNavProfileAvatar}
                          />
                        ) : (
                          getInitials(userProfile.username || user.email || 'User')
                        )}
                      </button>
                      <div className={styles.desktopNavUsername}>
                        {userProfile.username || user.email?.split('@')[0] || 'User'}
                      </div>
                    </>
                  ) : (
                    <div className={styles.desktopNavAuthButtons}>
                      <button 
                        className={styles.desktopLoginBtn}
                        onClick={handleLoginClick}
                      >
                        Log In
                      </button>
                      <button 
                        className={styles.desktopRegisterBtn}
                        onClick={handleRegisterClick}
                      >
                        Sign Up
                      </button>
                    </div>
                  )}
                </div>
                
                <div className={styles.desktopNavItems}>
                  <a 
                    href="/" 
                    className={`${styles.desktopNavItem} ${isActive('/') ? styles.active : ''}`}
                    onClick={(e) => handleNavigation('/', e)}
                  >
                    <FiHome className={styles.navIcon} />
                    <span>Home</span>
                  </a>
                  <a 
                    href="/games" 
                    className={`${styles.desktopNavItem} ${isActive('/games') ? styles.active : ''}`}
                    onClick={(e) => handleNavigation('/games', e)}
                  >
                    <RiGamepadFill className={styles.navIcon} />
                    <span>Games</span>
                  </a>
                  <a 
                    href="/collections" 
                    className={`${styles.desktopNavItem} ${isActive('/collections') ? styles.active : ''}`}
                    onClick={(e) => handleNavigation('/collections', e)}
                  >
                    <BsCollectionPlay className={styles.navIcon} />
                    <span>Collections</span>
                  </a>
                  <a 
                    href="/stats" 
                    className={`${styles.desktopNavItem} ${isActive('/stats') ? styles.active : ''}`}
                    onClick={(e) => handleNavigation('/stats', e)}
                  >
                    <FiBarChart2 className={styles.navIcon} />
                    <span>Stats</span>
                  </a>
                </div>
              </div>
            )}
            
            {/* Desktop search bar */}
            <div className={styles.desktopSearchContainer}>
              <SearchBar />
            </div>
            
            {/* Mobile controls */}
            <div className={styles.mobileControls}>
              <button 
                className={styles.mobileSearchToggle}
                onClick={toggleSearch}
                onTouchStart={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                onTouchEnd={(e) => e.currentTarget.style.transform = 'scale(1)'
                }
                aria-label="Toggle search"
              >
                <FiSearch size={20} />
              </button>
              <button 
                className={styles.mobileMenuToggle}
                onClick={toggleMobileMenu}
                onTouchStart={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                onTouchEnd={(e) => e.currentTarget.style.transform = 'scale(1)'}
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
              </button>
            </div>
          </div>
          
          {/* Mobile search dropdown */}
          {isSearchOpen && (
            <div className={styles.mobileSearchContainer}>
              <SearchBar />
            </div>
          )}
          
          {/* Mobile navigation menu - styled like Home.module.css */}
          {isMobileMenuOpen && (
            <>
              <div 
                className={styles.mobileMenuOverlay}
                onClick={closeMobileMenu}
              />
              <div className={styles.mobileNav}>
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
            </>
          )}
          
          <div className={styles.heroContent}>
            <motion.div 
              className={styles.coverWrapper}
              variants={itemVariants}
            >
              <img 
                src={gameDetail.cover} 
                alt={gameDetail.name} 
                className={styles.gameCover} 
              />
            </motion.div>
            
            <motion.div 
              className={styles.gameInfo}
              variants={itemVariants}
            >
              <h1 className={styles.gameTitle}>{gameDetail.name}</h1>
              
              {gameDetail.genres.length > 0 && (
                <div className={styles.gameGenres}>
                  {gameDetail.genres.map((genre, index) => (
                    <span key={`${genre}-${index}`} className={styles.genrePill}>
                      {genre}
                    </span>
                  ))}
                </div>
              )}
              
              <div className={styles.releasePlatforms}>
                {earliestRelease && (
                  <div className={styles.infoItem}>
                    <FiCalendar className={styles.infoIcon} />
                    <span>{formatReleaseDate(earliestRelease.date)}</span>
                  </div>
                )}
                
                {gameDetail.developers.length > 0 && (
                  <div className={styles.infoItem}>
                    <FiUsers className={styles.infoIcon} />
                    <span>{gameDetail.developers[0]}</span>
                  </div>
                )}
              </div>
              
              {/* Desktop action buttons - visible on desktop only */}
              <div className={styles.gameActions}>
                <Button 
                  className={`${styles.primaryButton} ${collectionStatus ? styles.inCollectionButton : ''}`}
                  onClick={openCollectionModal}
                >
                  <FiBookmark /> {collectionStatus ? 'In Collection' : 'Add to Collection'}
                </Button>
                <Button 
                  className={styles.reviewButton} 
                  onClick={scrollToReviews}
                >
                  <FiMessageSquare /> Write a Review
                </Button>
              </div>
            </motion.div>
          </div>
          
          {/* Move action buttons below hero on mobile */}
          <div className={styles.mobileActionsWrapper}>
            <div className={styles.gameActions}>
              <Button 
                className={`${styles.primaryButton} ${collectionStatus ? styles.inCollectionButton : ''}`}
                onClick={openCollectionModal}
              >
                <FiBookmark /> {collectionStatus ? 'In Collection' : 'Add to Collection'}
              </Button>
              <Button 
                className={styles.reviewButton} 
                onClick={scrollToReviews}
              >
                <FiMessageSquare /> Write a Review
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <motion.div 
        className={styles.gameContent}
        variants={containerVariants}
      >
        <div className={styles.twoColumnLayout}>
          <motion.div 
            className={styles.gameMainContent}
            variants={itemVariants}
          >
            <motion.section 
              className={styles.gameSummary}
              variants={itemVariants}
            >
              <h2>About</h2>
              <p>{gameDetail.summary}</p>
              {gameDetail.storyline && (
                <>
                  <h3>Storyline</h3>
                  <p>{gameDetail.storyline}</p>
                </>
              )}
            </motion.section>
            
            {/* Game Videos Section */}
            <motion.section 
              variants={itemVariants}
              className={styles.videoSection}
            >
              <GameVideosWrapper gameId={parseInt(id)} />
            </motion.section>
            
            {/* Screenshots Section */}
            {gameDetail.screenshots.length > 0 && (
              <motion.section 
                className={styles.screenshotsSection}
                variants={itemVariants}
              >
                <h2>Screenshots</h2>
                <ScreenshotGallery 
                  screenshots={gameDetail.screenshots} 
                  gameName={gameDetail.name} 
                />
              </motion.section>
            )}
            
            {/* Reviews Section */}
            <motion.section
              ref={reviewsRef}
              variants={itemVariants}
              className={styles.reviewsSection}
            >
              <h2 className={styles.reviewsTitle}>Game Reviews</h2>
              <div className={styles.reviewsContainer}>
                <DynamicReviewForm 
                  gameId={parseInt(id)}
                  gameName={gameDetail.name}
                  gameCover={gameDetail.cover}
                  onReviewSubmitted={handleReviewSubmitted}
                />
                <DynamicReviewsList 
                  gameId={parseInt(id)}
                  refreshTrigger={refreshReviews}
                />
              </div>
            </motion.section>
          </motion.div>
          
          <motion.aside 
            className={styles.gameSidebar}
            variants={itemVariants}
          >
            {gameDetail.platforms.length > 0 && (
              <motion.div 
                className={styles.sidebarCard}
                variants={itemVariants}
              >
                <h3>Available On</h3>
                <div className={styles.platformList}>
                  {gameDetail.platforms.map((platform, index) => (
                    <span key={index} className={styles.platformBadge}>
                      {platform}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
            
            {gameDetail.developers.length > 0 && (
              <motion.div 
                className={styles.sidebarCard}
                variants={itemVariants}
              >
                <h3>Developers</h3>
                <ul className={styles.simpleList}>
                  {gameDetail.developers.map((developer, index) => (
                    <li key={`${developer}-${index}`}>{developer}</li>
                  ))}
                </ul>
              </motion.div>
            )}
            
            {gameDetail.publishers.length > 0 && (
              <motion.div 
                className={styles.sidebarCard}
                variants={itemVariants}
              >
                <h3>Publishers</h3>
                <ul className={styles.simpleList}>
                  {gameDetail.publishers.map((publisher, index) => (
                    <li key={`${publisher}-${index}`}>{publisher}</li>
                  ))}
                </ul>
              </motion.div>
            )}
            
            {gameDetail.releaseDates.length > 0 && (
              <motion.div 
                className={styles.sidebarCard}
                variants={itemVariants}
              >
                <h3>Release Dates</h3>
                <ul className={styles.releaseDatesList}>
                  {gameDetail.releaseDates.map((release, index) => (
                    <li key={`${release.platform}-${release.date}-${index}`}>
                      <span className={styles.releasePlatform}>{release.platform}</span>
                      <span className={styles.releaseDate}>{formatReleaseDate(release.date)}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </motion.aside>
        </div>
      </motion.div>
      
      {/* Add the collection modal */}
      {gameDetail && (
        <AddToCollectionModal
          isOpen={isCollectionModalOpen}
          onClose={() => setIsCollectionModalOpen(false)}
          gameId={parseInt(id)}
          gameName={gameDetail.name}
          gameCover={gameDetail.cover}
          onCollectionUpdated={handleCollectionUpdated}
        />
      )}

      {/* Add the modals at the end */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        onSwitchToRegister={() => {
          setIsLoginModalOpen(false);
          setIsRegisterModalOpen(true);
        }} 
      />
      
      <RegisterModal 
        isOpen={isRegisterModalOpen} 
        onClose={() => setIsRegisterModalOpen(false)} 
        onSwitchToLogin={() => {
          setIsRegisterModalOpen(false);
          setIsLoginModalOpen(true);
        }} 
      />
    </motion.div>
  );
}
