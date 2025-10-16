import React, { useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../styles/UserAvatar.module.css';
import { getProfileImageUrl } from '../services/imageService';

interface UserAvatarProps {
  username: string;
  imageUrl?: string | null;
  editable?: boolean;
  onImageUpload?: (file: File) => Promise<void>;
  size?: 'small' | 'medium' | 'large';
  showUsername?: boolean;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ 
  username, 
  imageUrl, 
  editable = false,
  onImageUpload,
  size = 'medium',
  showUsername = false
}) => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const firstLetter = username.charAt(0).toUpperCase();
  
  // Process the image URL to ensure it's valid
  const processedImageUrl = imageUrl ? getProfileImageUrl(imageUrl) : undefined;
  
  const handleAvatarClick = () => {
    if (!editable) {
      router.push('/profile');
    } 
  };
  
  return (
    <div className={`${styles.avatarContainer} ${styles[`size-${size}`]}`}>
      <div 
        className={`${styles.avatar} ${styles[`avatar-${size}`]}`}
        onClick={handleAvatarClick}
        style={processedImageUrl ? { 
          backgroundImage: `url(${processedImageUrl})`, 
          backgroundSize: 'cover',
          backgroundPosition: 'center' 
        } : {}}
      >
        {!processedImageUrl && firstLetter}
      </div>
      
      {showUsername && (
        <div className={styles.usernameDisplay}>
          {username}
        </div>
      )}
    </div>
  );
};

export default UserAvatar;
