import styles from '../styles/Home.module.css';
import { FiHome } from 'react-icons/fi';
import { RiGamepadFill } from 'react-icons/ri';
import { BsCollectionPlay } from 'react-icons/bs';

const Navigation: React.FC = () => {
  return (
    <nav className={styles.nav}>
      <a href="/" className={styles.navItem}><FiHome className={styles.navIcon} /> <span>Home</span></a>
      <a className={styles.navItem}><RiGamepadFill className={styles.navIcon} /> <span>Games</span></a>
      <a className={styles.navItem}><BsCollectionPlay className={styles.navIcon} /> <span>Collections</span></a>
    </nav>
  );
};

export default Navigation;
