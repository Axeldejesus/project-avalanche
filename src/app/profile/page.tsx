import Image from 'next/image';
import styles from '../../styles/Home.module.css';
import profileStyles from '../../styles/Profile.module.css';
import Sidebar from '../../components/Sidebar';
import AuthButtonsWrapper from '../../components/AuthButtonsWrapper';
import SearchBar from '../../components/SearchBar';
import ProfileContent from '../../components/ProfileContent';

// React Icons
import { FiHome, FiSearch } from 'react-icons/fi';
import { RiGamepadFill } from 'react-icons/ri';
import { BsCollectionPlay } from 'react-icons/bs';

export default function ProfilePage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <Image src="/logo-avalanche.png" alt="Avalanche" width={100} height={30} />
        </div>
        
        <nav className={styles.nav}>
          <a href="/" className={styles.navItem}><FiHome className={styles.navIcon} /> <span>Home</span></a>
          <a className={styles.navItem}><RiGamepadFill className={styles.navIcon} /> <span>Games</span></a>
          <a className={styles.navItem}><BsCollectionPlay className={styles.navIcon} /> <span>Collections</span></a>
        </nav>
        
        <div className={styles.search}>
          <SearchBar />
        </div>
        
        <AuthButtonsWrapper />
      </header>

      <div className={styles.mainLayout}>
        <Sidebar />
        
        <main className={styles.main}>
          <ProfileContent />
        </main>
      </div>
    </div>
  );
}
