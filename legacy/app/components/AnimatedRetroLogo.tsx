import React, { useEffect, useState } from 'react';
import Image from 'next/image';

const AnimatedRetroLogo = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`retro-logo-container ${visible ? 'visible' : ''}`}>
      <div className="scan-line"></div>
      <Image src="/Skelogo.png" alt="Bank Logo" width={400} height={200} />
    </div>
  );
};

export default AnimatedRetroLogo;