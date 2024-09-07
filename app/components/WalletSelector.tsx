import React from 'react';
import { Wallet } from 'lucide-react';

interface WalletSelectorProps {
  wallets: { address: string; balance: string }[];
  selectedWalletIndex: number;
  onWalletChange: (index: number) => void;
}

const WalletSelector: React.FC<WalletSelectorProps> = ({
  wallets,
  selectedWalletIndex,
  onWalletChange,
}) => {
  return (
    <div className="wallet-selector">
      <select
        value={selectedWalletIndex}
        onChange={(e) => onWalletChange(Number(e.target.value))}
        className="wallet-select"
      >
        {wallets.map((wallet, index) => (
          <option key={wallet.address} value={index}>
            {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
          </option>
        ))}
      </select>
      <Wallet className="wallet-icon" size={24} />
    </div>
  );
};

export default WalletSelector;