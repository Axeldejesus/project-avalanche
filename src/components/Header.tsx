import Image from 'next/image';
import styles from '../styles/Home.module.css';
import Navigation from './Navigation';
import AuthButtonsWrapper from './AuthButtonsWrapper';

const Header: React.FC = () => {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <Image src="/logo-avalanche.png" alt="Avalanche" width={100} height={30} />
      </div>
      
      <Navigation />
      
      <AuthButtonsWrapper />
    </header>
  );
};

export default Header;
