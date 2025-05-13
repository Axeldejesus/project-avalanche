import { usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from '../styles/Home.module.css';

interface UserMenuProps {
  user: any; // Replace with your user type
}

const UserMenu: React.FC<UserMenuProps> = ({ user }) => {
  const pathname = usePathname();
  const isProfilePage = pathname === '/profile' || pathname.startsWith('/profile/');

  return (
    <div className={styles.userMenu}>
      <Link href="/profile">
        <div className={`${styles.userButton} ${isProfilePage ? styles.userButtonActive : ''}`}>
          {user?.username?.[0]?.toUpperCase() || 'A'}
        </div>
      </Link>
    </div>
  );
};

export default UserMenu;
