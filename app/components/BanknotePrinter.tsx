import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { mintBanknote, getBanknoteInfo, getTokenSymbol, getTokenAddresses } from '../utils/web3';
import { web3auth } from '../utils/web3';
import { Address } from 'viem';

interface BanknotePrinterProps {
  onClose: () => void;
  onPrint: () => void;
}

const BanknotePrinter: React.FC<BanknotePrinterProps> = ({ onClose, onPrint }) => {
  const [denomination, setDenomination] = useState('2');
  const [tokenSymbol, setTokenSymbol] = useState('USDC');
  const [privateKey, setPrivateKey] = useState('');
  const [formattedPrivateKey, setFormattedPrivateKey] = useState('');
  const [uniqueIdentifier, setUniqueIdentifier] = useState('');
  const [tokenAddresses, setTokenAddresses] = useState<{[key: string]: Address}>({});

  const denominations = ['2', '5', '10', '20', '50', '100'];
  const currencies = ['USDC', 'EURC', 'NZDT', 'ETH'];

  useEffect(() => {
    generatePrivateKey();
    fetchTokenAddresses();
  }, []);

  const fetchTokenAddresses = async () => {
    const addresses = await getTokenAddresses();
    setTokenAddresses(addresses);
  };

  const generatePrivateKey = () => {
    const key = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    setPrivateKey(key);
    setFormattedPrivateKey(formatPrivateKey(key));
  };

  const formatPrivateKey = (key: string) => {
    const groups = [4, 5, 4, 5, 4, 5, 4, 5, 4, 5, 4, 5, 4, 6];
    let formatted = '';
    let index = 0;
    for (const groupLength of groups) {
      if (formatted) formatted += '-';
      formatted += key.slice(index, index + groupLength);
      index += groupLength;
    }
    return formatted;
  };

  const generateAndSaveBanknotePDF = async () => {
    if (!web3auth.provider) {
      console.error("Web3Auth provider not available");
      return;
    }

    try {
      const tokenAddress = tokenAddresses[tokenSymbol];
      if (!tokenAddress) {
        console.error(`Token address not found for ${tokenSymbol}`);
        return;
      }

      // const { txHash, id, requestId } = await mintBanknote(
      //   web3auth.provider,
      //   tokenAddress,
      //   parseInt(denomination)
      // );

      // console.log(`Banknote minted. Transaction: ${txHash}, ID: ${id}, RequestID: ${requestId}`);

      // Wait for the randomness to be fulfilled (you might need to implement a polling mechanism or use events)
      // const banknoteInfo = await getBanknoteInfo(web3auth.provider, 0);
      // setUniqueIdentifier(banknoteInfo.uniqueIdentifier);

      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [156, 66] // US currency size (156mm x 66mm)
      });

      // Add background image
      const img = new Image();
      img.src = '/banknote_1.png';
      doc.addImage(img, 'PNG', 0, 0, 156, 66);

      // Add denomination and token symbol
      doc.setFontSize(24);
      doc.setTextColor(44, 62, 80); // Dark blue color
      doc.text(`${denomination} ${tokenSymbol}`, 156 - 42, 8 + 24/2, { align: 'left', baseline: 'middle' });

      // Generate QR code for private key (unformatted)
      const qr = await QRCode.toDataURL(privateKey);
      const qrSize = 36;
      doc.addImage(qr, 'PNG', 156 - 9 - qrSize, (55 / 2), qrSize, qrSize);

      // Add formatted private key text
      doc.setFontSize(6);
      doc.setTextColor(168, 168, 168);
      doc.text(`PK: ${formattedPrivateKey}`, 10, 66 - 1, { maxWidth: 136 });

      // // Add unique identifier
      // doc.setFontSize(8);
      // doc.setTextColor(44, 62, 80);
      // doc.text(`Unique ID: ${uniqueIdentifier}`, 10, 66 - 10, { maxWidth: 136 });

      // Save the PDF
      doc.save(`banknote_${denomination}${tokenSymbol}.pdf`);
    } catch (error) {
      console.error("Error generating banknote:", error);
    }
  };

  return (
    <div className="banknote-printer" style={{ padding: '6px', textAlign: 'center' }}>
      <div>Print Test Banknote</div>
      <div style={{ marginBottom: '10px' }}>
        <select
          value={denomination}
          onChange={(e) => setDenomination(e.target.value)}
          style={{ padding: '5px', margin: '5px', width: '100px' }}
        >
          {denominations.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select
          value={tokenSymbol}
          onChange={(e) => setTokenSymbol(e.target.value)}
          style={{ padding: '5px', margin: '5px', width: '100px' }}
        >
          {currencies.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <input
        type="text"
        placeholder="Private Key"
        value={formattedPrivateKey}
        readOnly
        style={{ padding: '5px', margin: '5px', width: 'calc(100% - 20px)' }}
      />
      <button onClick={generatePrivateKey} style={{ padding: '5px 10px', margin: '5px' }}>Generate New Key</button>
      <button onClick={generateAndSaveBanknotePDF} style={{ padding: '5px 10px', margin: '5px' }}>Print</button>
      {uniqueIdentifier && (
        <div style={{ marginTop: '10px' }}>
          Unique Identifier: {uniqueIdentifier}
        </div>
      )}
    </div>
  );
};

export default BanknotePrinter;