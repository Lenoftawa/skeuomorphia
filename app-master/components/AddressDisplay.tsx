import React from 'react';

interface AddressDisplayProps {
  address: string;
}

const AddressDisplay: React.FC<AddressDisplayProps> = ({ address }) => {
  const truncatedAddress = `${address}`;

  return (
    <span style={{ fontSize: '24px' }}>{truncatedAddress}</span>
  );
};

export default AddressDisplay;

// import React from 'react';

// interface AddressDisplayProps {
//     address: string;
// }

// const AddressDisplay: React.FC<AddressDisplayProps> = ({ address }) => {
//     if (!address) return null;
//     const addressStr = String(address);
//     const displayAddress = `${addressStr.substring(0, 5)}...${addressStr.substring(addressStr.length - 5)}`;
//     return <p>{displayAddress}</p>;
// };

// export default AddressDisplay;