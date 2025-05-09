'use client';

import React, { useState } from 'react';

interface PlatformImageProps {
  src: string;
  alt: string;
  className?: string;
}

const PlatformImage: React.FC<PlatformImageProps> = ({ src, alt, className }) => {
  const [imgError, setImgError] = useState(false);
  
  // Générer des couleurs basées sur le nom de la plateforme
  const getPlatformColor = (name: string): string => {
    const normalized = name.toLowerCase();
    if (normalized.includes('playstation')) return '#006FCD';
    if (normalized.includes('xbox')) return '#107C10';
    if (normalized.includes('nintendo') || normalized.includes('switch')) return '#E60012';
    if (normalized.includes('pc')) return '#333333';
    return '#6c5ce7';
  };

  // Générer un SVG placeholder
  const generateSvgPlaceholder = (name: string): string => {
    const bgColor = getPlatformColor(name);
    const initials = name.split(' ')
      .map(word => word.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
    
    const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
        <rect width="60" height="60" fill="${bgColor}" rx="8" ry="8"/>
        <text x="30" y="36" font-family="Arial, sans-serif" font-size="24" fill="white" text-anchor="middle">${initials}</text>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${btoa(svgContent)}`;
  };

  const handleError = () => {
    setImgError(true);
  };

  // Utiliser un SVG généré dynamiquement en cas d'erreur
  const imageSrc = imgError ? generateSvgPlaceholder(alt) : src;

  return (
    <div className={className} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <img 
        src={imageSrc} 
        alt={alt} 
        onError={handleError}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
    </div>
  );
};

export default PlatformImage;
