import React from 'react';

interface ATMButtonProps {
  className: string;
  onClick: () => void;
}

const ATMButton: React.FC<ATMButtonProps> = ({ className, onClick }) => {
  return (
    <div className={className} onClick={onClick}>
      {' '}
    </div>
  );
};

export default ATMButton;