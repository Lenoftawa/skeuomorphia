import React, { useEffect, useState } from 'react';
import Image from 'next/image';

const AnimatedRetroLogo = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // Inline styles for the glitch effect
  const glitchContainerStyle = {
    position: 'relative',
    width: '200px',
    height: '200px',
    display: 'inline-block',
  };

  const glitchStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    animation: 'glitch 1s infinite',
  };

  return (
    <div className={`retro-logo-container ${visible ? 'visible' : ''}`}>
      <div className="scan-line"></div>
      <div style={glitchContainerStyle}>
        <Image 
          src="/OnlyIcon.png" 
          alt="Bank Logo"  
          width={200} 
          height={200} 
          style={{ ...glitchStyle, clipPath: 'inset(0 0 50% 0)' }} 
        />
        <Image 
          src="/OnlyIcon.png" 
          alt="Bank Logo"  
          width={200} 
          height={200} 
          style={{ ...glitchStyle, clipPath: 'inset(50% 0 0 0)', animationDelay: '0.2s', opacity: '0.8' }} 
        />
      </div>
    </div>
  );
};

export default AnimatedRetroLogo;
