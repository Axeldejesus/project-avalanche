'use client';

import React, { useRef } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { getProfileImageUrl } from '../services/imageService';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl' | 'small' | 'medium' | 'large' | 'xlarge';

interface UserAvatarProps {
  username: string;
  imageUrl?: string | null;
  editable?: boolean;
  onImageUpload?: (file: File) => Promise<void>;
  size?: AvatarSize;
  showUsername?: boolean;
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'h-8 w-8 text-xs',
  small: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  medium: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-2xl',
  large: 'h-16 w-16 text-2xl',
  xl: 'h-24 w-24 text-3xl',
  xlarge: 'h-24 w-24 text-3xl',
};

const UserAvatar: React.FC<UserAvatarProps> = ({
  username,
  imageUrl,
  editable = false,
  onImageUpload,
  size = 'medium',
  showUsername = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const firstLetter = username.charAt(0).toUpperCase();
  const processedImageUrl = imageUrl ? getProfileImageUrl(imageUrl) : undefined;

  const handleClick = () => {
    if (editable && onImageUpload && fileInputRef.current) {
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
    <div className="flex items-center gap-2">
      <Avatar
        className={cn(
          sizeClasses[size],
          'border-2 border-border ring-offset-background transition-all',
          editable && 'cursor-pointer hover:brightness-75'
        )}
        onClick={handleClick}
      >
        <AvatarImage src={processedImageUrl} alt={username} />
        <AvatarFallback className="bg-primary/20 text-primary font-semibold">
          {firstLetter}
        </AvatarFallback>
      </Avatar>

      {editable && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      )}

      {showUsername && (
        <span className="text-sm font-medium text-foreground">{username}</span>
      )}
    </div>
  );
};

export default UserAvatar;
