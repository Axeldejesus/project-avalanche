import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FiCamera } from 'react-icons/fi';
import styles from '../styles/UserAvatar.module.css';
import { getProfileImageUrl } from '../services/imageService';

interface UserAvatarProps {
  username: string;
  imageUrl?: string;
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
    } else if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImageUpload) {
      await onImageUpload(file);
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
      
      {editable && (
        <div className={styles.uploadText} onClick={handleUploadClick}>
          <FiCamera className={styles.cameraIcon} />
          <span>Add picture</span>
        </div>
      )}
      
      {editable && (
        <input
          type="file"
          ref={fileInputRef}
          className={styles.fileInput}
          accept="image/*"
          onChange={handleFileChange}
        />
      )}
    </div>
  );
};

export default UserAvatar;
