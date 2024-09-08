import React from 'react';
import AddressDisplay from './AddressDisplay';

interface BalanceScreenProps {
  address: string;
  balances: {
    ETH: string;
    USDC: string;
    EURC: string;
    NZDT: string;
  };
  currentToken: 'ETH' | 'USDC' | 'EURC' | 'NZDT';
  onTokenChange: (token: 'ETH' | 'USDC' | 'EURC' | 'NZDT') => void;
}

const BalanceScreen: React.FC<BalanceScreenProps> = ({ address, balances, currentToken, onTokenChange }) => {
  return (
    <div className="balance-screen">
      <AddressDisplay
        address={address}
        balances={balances}
        currentToken={currentToken}
        onTokenChange={onTokenChange}
      />
      <div className="balance-list">
        {Object.entries(balances).map(([token, balance]) => (
          <div key={token} className="balance-item">
            <span className="token-symbol">{token}</span>
            <span className="token-balance">{balance}</span>
          </div>
        ))}
      </div>

      <style jsx>{`
        .balance-screen {
          display: flex;
          flex-direction: column;
          align-items: center;
          font-family: "EnterCommand", monospace;
         
        }
        .balance-list {
          margin-top: 20px;
          width: 100%;
          max-width: 300px;
        }
        .balance-item {
          display: flex;
          justify-content: space-between;
          padding: 10px;
          font-size: 24px;
          border: 1px solid var(--secondary-color);
          margin-bottom: 10px;
    
        }
        .token-symbol {
          font-weight: bold;
        }
        .token-balance {
   
        }
      `}</style>
    </div>
  );
};

export default BalanceScreen;