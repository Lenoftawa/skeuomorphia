import React from 'react';
import { Screen } from '../../data/interfaces';
import AddressDisplay from '../AddressDisplay';

interface ATMScreenProps {
  screen: Screen;
  address: string;
  balance: string;
  messageTop: string;
  messageBottom: string;
}

const ATMScreen: React.FC<ATMScreenProps> = ({ screen, address, balance, messageTop, messageBottom }) => {
  return (
    <div className="screen-container">
      <div className="screen">
        {address && <AddressDisplay address={address} />}
        {balance && <p>{balance} ETH</p>}
        <h2>{screen.title}</h2>
        {messageTop && <p>{messageTop}</p>}
        {screen.options.map((item, index) => (
          <div key={`option-${index}`} className="screen-option">
            <span>{item.left.message}</span>
            <span>{item.right.message}</span>
          </div>
        ))}
        {messageBottom && <p>{messageBottom}</p>}
      </div>
    </div>
  );
};

export default ATMScreen;