'use client';

import { useRouter } from 'next/navigation';
import { FiArrowLeft } from 'react-icons/fi';
import { useEffect, useState } from 'react';

const BackButton: React.FC = () => {
  const router = useRouter();
  const [destination, setDestination] = useState('/');
  
  useEffect(() => {
    // Vérifier les flags de navigation
    const cameFromGames = sessionStorage.getItem('cameFromGames');
    const cameFromHome = sessionStorage.getItem('cameFromHome');
    const cameFromCalendar = sessionStorage.getItem('cameFromCalendar');
    const cameFromProfile = sessionStorage.getItem('cameFromProfile');
    const cameFromCollection = sessionStorage.getItem('cameFromCollection');
    
    if (cameFromGames === 'true') {
      setDestination('/games');
    } else if (cameFromHome === 'true' || cameFromCalendar === 'true') {
      setDestination('/');
    } else if (cameFromProfile === 'true') {
      setDestination('/profile');
    } else if (cameFromCollection === 'true') {
      setDestination('/collections');
    } else {
      setDestination('/');
    }
  }, []);
  
  const handleBack = () => {
    if (destination === '/profile') {
      sessionStorage.removeItem('cameFromProfile');
    }
    
    if (destination === '/collections') {
      sessionStorage.removeItem('cameFromCollection');
    }
    
    router.push(destination);
  };
  
  // Utiliser un style inline pour correspondre aux autres boutons mobiles
  const buttonStyle: React.CSSProperties = {
    background: 'rgba(30, 30, 45, 0.7)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: 'white',
    padding: '0 1rem',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '0.95rem',
    fontWeight: '500',
    gap: '0.5rem'
  };
  
  return (
    <button 
      style={buttonStyle}
      onClick={handleBack}
      aria-label="Back to previous page"
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(40, 40, 55, 0.8)';
        e.currentTarget.style.borderColor = 'rgba(108, 92, 231, 0.4)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(30, 30, 45, 0.7)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <FiArrowLeft size={20} />
      <span>Back</span>
    </button>
  );
};

export default BackButton;
