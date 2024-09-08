import React, { useState, useEffect, useCallback } from "react";
import QRCode from "qrcode";
import AddressDisplay from "./AddressDisplay";

interface DepositScreenProps {
  address: string;
  balances: {
    ETH: string;
    USDC: string;
    EURC: string;
    NZDT: string;
  };
  currentToken: "ETH" | "USDC" | "EURC" | "NZDT";
  onTokenChange: (token: "ETH" | "USDC" | "EURC" | "NZDT") => void;
}

const generateQRCode = async (data: string): Promise<string> => {
  try {
    const qr = await QRCode.toDataURL(data);
    return qr;
  } catch (err) {
    console.error("Error generating QR code:", err);
    return "";
  }
};

const RainbowText: React.FC<{ text: string }> = ({ text }) => {
  const [colorIndex, setColorIndex] = useState(0);
  const colors = [
    "#FF0000",
    "#FF7F00",
    "#FFFF00",
    "#00FF00",
    "#0000FF",
    "#8B00FF",
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setColorIndex((prevIndex) => (prevIndex + 1) % colors.length);
    }, 100);
    return () => clearInterval(timer);
  }, []);

  return (
    <span style={{ color: colors[colorIndex], fontWeight: "bold" }}>
      {text}
    </span>
  );
};

function DepositScreen({
  address,
  balances,
  currentToken,
  onTokenChange,
}: DepositScreenProps) {
  const [qrCode, setQrCode] = useState<string>("");

  useEffect(() => {
    generateQRCode(address).then(setQrCode);
  }, [address]);

  return (
    <div className="deposit-screen">
      <div className="qr-section">
        <div className="qr-text">
          <div className="scan-qr">SCAN QR</div>
        </div>
        {qrCode && <img src={qrCode} alt="QR Code" className="qr-code" />}
      </div>
{/* 
      <div className="buy-crypto-text">
        <RainbowText text="Buy Crypto" />
      </div> */}

      <AddressDisplay
        address={address}
        balances={balances}
        currentToken={currentToken}
        onTokenChange={onTokenChange}
      />

      <div className="alert">
        <p>
          ⚠️ Important: Only send ETH or supported ERC20 tokens to this address.
        </p>
        <p>Sending unsupported tokens may result in loss of funds.</p>
      </div>

      <style jsx>{`
        .deposit-screen {
          font-family: "EnterCommand", monospace;
          color: var(--secondary-color);
          padding: 20px;
          overflow-y: auto;
          max-height: 100%;
          position: relative;
        }
        .qr-section {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }
        .qr-code {
          background-color: #ffffff;
          padding: 10px;
          width: 150px;
          height: 150px;
             margin-right: -20px;
                 margin-left: 10px;

        }
        .qr-text {
          margin-right: 14px;
            margin-left: -60px;
        }
        .scan-qr {
          font-size: 54px;
          font-weight: bold;
          animation: flicker 0.5s infinite alternate;
        }
        .alert {
          background-color: var(--bg-color-3);
          color: var(--secondary-color);
          padding: 10px;
          font-size: 24px;
          margin-top: 20px;
          text-align: center;
        }
        .buy-crypto-text {
          position: absolute;
          top: 10px;
          right: 10px;
          font-size: 20px;
        }
        @keyframes flicker {
          0% {
            opacity: 0.5;
          }
          100% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

export default DepositScreen;
