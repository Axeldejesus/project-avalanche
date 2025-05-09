'use client';

import React from 'react';
import Image from 'next/image';
import { IconType } from 'react-icons';
import { getPlatformReactIcon } from '../utils/platform-helpers';

interface PlatformImageProps {
  src?: string;
  icon?: IconType;
  platformId?: number;
  platformName?: string;
  alt: string;
  className?: string;
  size?: number;
}

const PlatformImage: React.FC<PlatformImageProps> = ({
  src,
  icon,
  platformId,
  platformName,
  alt,
  className,
  size = 24
}) => {
  // If icon component is directly provided, render it
  if (icon) {
    const IconComponent = icon;
    return <IconComponent size={size} className={className} title={alt} />;
  }
  
  // If platformId or platformName is provided, get the appropriate icon
  if (platformId || platformName) {
    const IconComponent = getPlatformReactIcon(platformId, platformName);
    return <IconComponent size={size} className={className} title={alt} />;
  }
  
  // Fallback to traditional image if src is provided
  if (src) {
    return (
      <div className={className} style={{ width: size, height: size }}>
        <Image 
          src={src} 
          alt={alt} 
          width={size} 
          height={size} 
          style={{ objectFit: 'contain' }}
        />
      </div>
    );
  }
  
  // Ultimate fallback - question mark icon
  const { BsQuestionCircle } = require('react-icons/bs');
  return <BsQuestionCircle size={size} className={className} title={alt} />;
};

export default PlatformImage;
