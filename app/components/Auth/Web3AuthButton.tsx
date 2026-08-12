import React from 'react';

interface Web3AuthButtonProps {
  isLoggedIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
}

const Web3AuthButton: React.FC<Web3AuthButtonProps> = ({ isLoggedIn, onLogin, onLogout }) => {
  return (
    <div className="monitor-bottom">
      <div className="power-switch" onClick={isLoggedIn ? onLogout : onLogin}>
        <div className={`power-led ${isLoggedIn ? 'on' : ''}`}></div>
      </div>
    </div>
  );
};

export default Web3AuthButton;