import styles from '../styles/Home.module.css';
import Navigation from './Navigation';
import AuthButtonsWrapper from './AuthButtonsWrapper';
import Link from 'next/link';

const Header: React.FC = () => {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logo}>
        AVALANCHE
      </Link>
      
      <Navigation />
      
      {/* AuthButtonsWrapper is only visible on desktop */}
      <AuthButtonsWrapper />
    </header>
  );
};

export default Header;
