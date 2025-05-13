'use client';

import styles from '../styles/Home.module.css';
import { FiHome } from 'react-icons/fi';
import { RiGamepadFill } from 'react-icons/ri';
import { BsCollectionPlay } from 'react-icons/bs';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const Navigation: React.FC = () => {
  const pathname = usePathname();
  
  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };

  return (
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
    </nav>
  );
};

export default Navigation;
