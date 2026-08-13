import React from 'react';
import ATMButton from './ATMButton';
import { Screen } from '../../data/interfaces';

interface ATMKeypadProps {
  screen: Screen;
  onButtonClick: (actionId: number) => void;
}

const ATMKeypad: React.FC<ATMKeypadProps> = ({ screen, onButtonClick }) => {
  return (
    <>
      <div className="flex-left">
        {screen.options.map((item, index) => (
          <ATMButton
            key={`left-${index}`}
            className="button2"
            onClick={() => onButtonClick(item.left.actionId)}
          />
        ))}
      </div>
      <div className="flex">
        {screen.options.map((item, index) => (
          <ATMButton
            key={`right-${index}`}
            className="button1"
            onClick={() => onButtonClick(item.right.actionId)}
          />
        ))}
      </div>
    </>
  );
};

export default ATMKeypad;