import React from 'react';
import { useRouter } from 'next/navigation';
import styles from '../styles/UserAvatar.module.css';

interface UserAvatarProps {
  username: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ username }) => {
  const router = useRouter();
  const firstLetter = username.charAt(0).toUpperCase();
  
  const handleClick = () => {
    router.push('/profile');
  };
  
  return (
    <div className={styles.avatar} onClick={handleClick}>
      {firstLetter}
    </div>
  );
};

export default UserAvatar;
