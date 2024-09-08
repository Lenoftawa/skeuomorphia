import React from 'react';
import { WALLET_ADAPTERS } from "@web3auth/base";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (loginType: string) => Promise<void>;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin }) => {
  if (!isOpen) return null;

  const handleLogin = async (loginType: string) => {
    await onLogin(loginType);
    onClose();
  };

  return (
    <div className="login-modal-overlay">
      <div className="login-modal">
        <h2>Connect Wallet</h2>
        <button onClick={() => handleLogin(WALLET_ADAPTERS.GOOGLE)}>Login with Google</button>
        <button onClick={() => handleLogin(WALLET_ADAPTERS.FACEBOOK)}>Login with Facebook</button>
        <button onClick={() => handleLogin(WALLET_ADAPTERS.TWITTER)}>Login with Twitter</button>
        <button onClick={() => handleLogin(WALLET_ADAPTERS.EMAIL_PASSWORDLESS)}>Login with Email</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

export default LoginModal;