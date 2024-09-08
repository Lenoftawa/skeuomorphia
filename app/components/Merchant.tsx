"use client";

import React, { useState, useEffect } from "react";
import QRScanner from "./QRScanner";
import TransactionHistory from "./TransactionHistory";
import CameraTest from "./CameraTest";
import { Transaction } from "../types";
import {
  redeemBanknote,
  getTokenBalance,
  getTokenAddresses,
  web3auth,
} from "../utils/web3";
import { ethers } from "ethers";
import { jsPDF } from "jspdf";
import { Address } from "viem";

interface ScannedWallet {
  privateKey: string;
  balance: number;
}

const simulateRedeemToken = async (
  privateKey: string,
  merchantPublicKey: string
): Promise<{ amount: number; txHash: string }> => {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  if (Math.random() > 0.1) {
    return {
      amount: parseFloat((Math.random() * 100).toFixed(2)),
      txHash: `0x${Math.random().toString(16).substr(2, 40)}`,
    };
  } else {
    throw new Error("Transaction failed. Please try again.");
  }
};

const simulateGetPaperWalletBalance = async (
  privateKey: string
): Promise<number> => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return parseFloat((Math.random() * 1000).toFixed(2));
};

const simulateRedeemPaperWallets = async (
  wallets: ScannedWallet[],
  merchantPublicKey: string
): Promise<{ amount: number; txHash: string }> => {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  if (Math.random() > 0.1) {
    const totalAmount = wallets.reduce(
      (sum, wallet) => sum + wallet.balance,
      0
    );
    return {
      amount: totalAmount,
      txHash: `0x${Math.random().toString(16).substr(2, 40)}`,
    };
  } else {
    throw new Error("Transaction failed. Please try again.");
  }
};

const translations = {
  English: {
    merchantIdLabel: "Enter Your Merchant ID:",
    next: "Next",
    scanCode: "Scan Customer's Payment Code",
    confirmPayment: "Confirm Payment Details",
    proceedToPayment: "Proceed to Payment",
    processPayment: "Process Payment",
    confirmPaymentButton: "Confirm Payment",
    paymentComplete: "Payment Complete",
    newPayment: "New Payment",
    amount: "Amount",
    transactionId: "Transaction ID",
    date: "Date",
    merchantId: "Merchant ID",
    settings: "Settings",
    back: "Back",
    currency: "Currency",
    language: "Language",
    saveSettings: "Save Settings",
    emailReceipt: "Email Receipt",
    printReceipt: "Print Receipt",
    cameraTest: "Camera Test",
  },
  Spanish: {
    merchantIdLabel: "Ingrese su ID de comerciante:",
    next: "Siguiente",
    scanCode: "Escanear código de pago del cliente",
    confirmPayment: "Confirmar detalles del pago",
    proceedToPayment: "Proceder al pago",
    processPayment: "Procesar pago",
    confirmPaymentButton: "Confirmar pago",
    paymentComplete: "Pago completado",
    newPayment: "Nuevo pago",
    amount: "Monto",
    transactionId: "ID de transacción",
    date: "Fecha",
    merchantId: "ID de comerciante",
    settings: "Configuración",
    back: "Volver",
    currency: "Moneda",
    language: "Idioma",
    saveSettings: "Guardar configuración",
    emailReceipt: "Enviar recibo por correo",
    printReceipt: "Imprimir recibo",
    cameraTest: "Prueba de cámara",
  },
  French: {
    merchantIdLabel: "Entrez votre ID de marchand :",
    next: "Suivant",
    scanCode: "Scanner le code de paiement du client",
    confirmPayment: "Confirmer les détails du paiement",
    proceedToPayment: "Procéder au paiement",
    processPayment: "Traiter le paiement",
    confirmPaymentButton: "Confirmer le paiement",
    paymentComplete: "Paiement terminé",
    newPayment: "Nouveau paiement",
    amount: "Montant",
    transactionId: "ID de transaction",
    date: "Date",
    merchantId: "ID de marchand",
    settings: "Paramètres",
    back: "Retour",
    currency: "Devise",
    language: "Langue",
    saveSettings: "Enregistrer les paramètres",
    emailReceipt: "Envoyer le reçu par email",
    printReceipt: "Imprimer le reçu",
    cameraTest: "Test de caméra",
  },
};

export default function Merchant() {
  const [step, setStep] = useState(1);
  const [merchantPublicKey, setMerchantPublicKey] = useState("");
  const [scannedPrivateKey, setScannedPrivateKey] = useState("");
  const [redeemStatus, setRedeemStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionHistory, setTransactionHistory] = useState<Transaction[]>(
    []
  );
  const [currentTransaction, setCurrentTransaction] =
    useState<Transaction | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [currency, setCurrency] = useState("NZD");
  const [language, setLanguage] = useState("English");
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(
    null
  );
  const [showCameraTest, setShowCameraTest] = useState(false);
  const [paperWalletBalance, setPaperWalletBalance] = useState<number | null>(
    null
  );
  const [scannedBalance, setScannedBalance] = useState("");
  const [scannedWallets, setScannedWallets] = useState<ScannedWallet[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [scannedBalances, setScannedBalances] = useState<{
    USDC: string;
    EURC: string;
    NZDT: string;
  }>({ USDC: "", EURC: "", NZDT: "" });
  const [selectedToken, setSelectedToken] = useState<"USDC" | "EURC" | "NZDT">(
    "USDC"
  );
  const [tokenAddresses, setTokenAddresses] = useState<{
    USDC: Address;
    EURC: Address;
    NZDT: Address;
  }>({
    USDC: "0x" as Address,
    EURC: "0x" as Address,
    NZDT: "0x" as Address,
  });
  const [manualPrivateKey, setManualPrivateKey] = useState("");
  const [manualBanknoteId, setManualBanknoteId] = useState("");

  const t = translations[language as keyof typeof translations];

  useEffect(() => {
    if (
      "mediaDevices" in navigator &&
      "getUserMedia" in navigator.mediaDevices
    ) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then(() => setCameraPermission(true))
        .catch(() => setCameraPermission(false));
    } else {
      setCameraPermission(false);
    }
  }, []);

  useEffect(() => {
    async function fetchAndSetTokenAddresses() {
      try {
        const addresses = await getTokenAddresses();
        setTokenAddresses(addresses);
      } catch (error) {
        console.error("Error fetching token addresses:", error);
      }
    }
    fetchAndSetTokenAddresses();
  }, []);

  const handleScan = async (data: string) => {
    try {
      setScannedPrivateKey(data);
      const wallet = new ethers.Wallet(data);
      
      if (!web3auth.provider) {
        throw new Error("Web3Auth provider not available");
      }

      const usdcBalance = await getTokenBalance(web3auth.provider, wallet.address as Address, tokenAddresses.USDC);
      const eurcBalance = await getTokenBalance(web3auth.provider, wallet.address as Address, tokenAddresses.EURC);
      const nzdtBalance = await getTokenBalance(web3auth.provider, wallet.address as Address, tokenAddresses.NZDT);
      
      setScannedBalances({
        USDC: usdcBalance,
        EURC: eurcBalance,
        NZDT: nzdtBalance,
      });
      setShowConfirmation(true);
      setStep(3); // Automatically move to the confirmation step
    } catch (error) {
      setError((error as Error).message);
    }
  };

  const handleRedeem = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!web3auth.provider) {
        throw new Error("Web3Auth provider not available");
      }
      
      const result = await redeemBanknote(
        web3auth.provider,
        parseInt(manualBanknoteId),
        BigInt(scannedBalances[selectedToken]), // Convert to BigInt
        "0x" as `0x${string}`, // Placeholder for signature
        "Redemption" // Placeholder for description
      );

      const newTransaction: Transaction = {
        amount: parseFloat(result.amount),
        txHash: result.txHash,
        timestamp: new Date().toISOString(),
        tokenSymbol: result.tokenSymbol,
      };
      setCurrentTransaction(newTransaction);
      setTransactionHistory((prev) => [newTransaction, ...prev]);
      setRedeemStatus(
        `Payment of ${result.amount} ${result.tokenSymbol} received successfully!`
      );
      setScannedPrivateKey("");
      setScannedBalances({ USDC: "", EURC: "", NZDT: "" });
      setStep(4);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualRedeem = async () => {
    if (!ethers.isHexString(manualPrivateKey) || manualPrivateKey.length !== 66) {
      setError("Invalid private key format");
      return;
    }
  
    const banknoteId = parseInt(manualBanknoteId);
    if (isNaN(banknoteId) || banknoteId < 0) {
      setError("Invalid banknote ID");
      return;
    }
  
    setIsLoading(true);
    setError(null);
    try {
      if (!web3auth.provider) {
        throw new Error("Web3Auth provider not available");
      }
  
      // We need to determine the amount and token type here
      // For now, let's assume we're using the selected token and its balance
      const amount = BigInt(parseFloat(scannedBalances[selectedToken]) * 1e18); // Convert to wei
      const signature = "0x" as `0x${string}`; // Placeholder signature
      const description = "Manual Redemption"; // Description for the redemption
  
      const result = await redeemBanknote(
        web3auth.provider,
        banknoteId,
        amount,
        signature,
        description
      );
  
      const newTransaction: Transaction = {
        amount: parseFloat(result.amount),
        txHash: result.txHash,
        timestamp: new Date().toISOString(),
        tokenSymbol: result.tokenSymbol,
      };
      setCurrentTransaction(newTransaction);
      setTransactionHistory((prev) => [newTransaction, ...prev]);
      setRedeemStatus(
        `Payment of ${result.amount} ${result.tokenSymbol} received successfully!`
      );
      setManualPrivateKey("");
      setManualBanknoteId("");
      setStep(4);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const emailReceipt = () => {
    // Implement email functionality here
    alert("Receipt emailed to customer");
  };

  const printReceipt = () => {
    // Implement print functionality here
    window.print();
  };

  const printRedemptionReceipt = () => {
    if (!currentTransaction) return;

    const doc = new jsPDF();

    // Add logo or header
    doc.setFontSize(22);
    doc.text("Skeuomorphia Bank", 105, 20, { align: "center" });

    doc.setFontSize(18);
    doc.text("Redemption Receipt", 105, 30, { align: "center" });

    doc.setFontSize(12);
    doc.text(
      `Amount: ${currentTransaction.amount} ${currentTransaction.tokenSymbol}`,
      20,
      50
    );
    doc.text(`Transaction ID: ${currentTransaction.txHash}`, 20, 60);
    doc.text(
      `Date: ${new Date(currentTransaction.timestamp).toLocaleString()}`,
      20,
      70
    );
    doc.text(`Merchant ID: ${merchantPublicKey}`, 20, 80);

    // Add QR code for transaction verification (you might want to use a proper QR code library)
    doc.rect(140, 50, 50, 50);
    doc.text("Scan to Verify", 165, 105, { align: "center" });

    // Add footer
    doc.setFontSize(10);
    doc.text("Thank you for using Skeuomorphia Bank", 105, 280, {
      align: "center",
    });

    // Save the PDF
    doc.save(`redemption_receipt_${currentTransaction.txHash.slice(0, 6)}.pdf`);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="merchant-step">
            <label htmlFor="merchantKey" className="merchant-label">
              {t.merchantIdLabel}
            </label>
            <input
              id="merchantKey"
              type="text"
              value={merchantPublicKey}
              onChange={(e) => setMerchantPublicKey(e.target.value)}
              className="merchant-input"
              placeholder={t.merchantIdLabel}
            />
            <button
              onClick={() => setStep(2)}
              disabled={!merchantPublicKey}
              className="merchant-button"
            >
              {t.next}
            </button>
          </div>
        );
      case 2:
        return (
          <div className="merchant-step">
            <h3 className="merchant-subtitle">Scan or Enter Private Key</h3>
            <QRScanner onScan={handleScan} onError={(err) => setError(err)} />
            <div className="merchant-manual-input">
              <label htmlFor="manualBanknoteId" className="merchant-label">
                Enter banknote ID:
              </label>
              <input
                type="number"
                id="manualBanknoteId"
                value={manualBanknoteId}
                onChange={(e) => setManualBanknoteId(e.target.value)}
                className="merchant-input"
                placeholder="Enter banknote ID"
              />
              <button onClick={handleManualRedeem} className="merchant-button">
                Submit Banknote ID
              </button>
            </div>
            {scannedPrivateKey && (
              <div className="merchant-scanned-info">
                <span>Private Key Received</span>
                <div className="merchant-check-icon"></div>
              </div>
            )}
          </div>
        );
      case 3:
        return (
          <div className="merchant-step">
            <h3 className="merchant-title">Review and Confirm Redemption</h3>
            <div className="merchant-balance-info">
              {Object.entries(scannedBalances).map(([token, balance]) => (
                <div key={token} className="merchant-subtitle">
                  <span>{token} Balance</span>
                  <span>
                    {balance} {token}
                  </span>
                </div>
              ))}
            </div>
            <select
              value={selectedToken}
              onChange={(e) =>
                setSelectedToken(e.target.value as "USDC" | "EURC" | "NZDT")
              }
              className="merchant-select"
            >
              <option value="USDC">USDC</option>
              <option value="EURC">EURC</option>
              <option value="NZDT">NZDT</option>
            </select>
            <button
              onClick={handleRedeem}
              disabled={isLoading}
              className="merchant-button merchant-button-redeem"
            >
              {isLoading ? "Processing..." : `Redeem ${selectedToken}`}
            </button>
          </div>
        );
      case 4:
        return (
          <div className="merchant-step">
            <h3 className="merchant-subtitle merchant-success">
              {t.paymentComplete}
            </h3>
            {currentTransaction && (
              <div className="merchant-receipt">
                <h4 className="merchant-receipt-title">Payment Receipt</h4>
                <p className="merchant-receipt-info">
                  {t.amount}: {currentTransaction.amount.toFixed(2)}{" "}
                  {currentTransaction.tokenSymbol}
                </p>
                <p className="merchant-receipt-info">
                  {t.transactionId}: {currentTransaction.txHash}
                </p>
                <p className="merchant-receipt-info">
                  {t.date}:{" "}
                  {new Date(currentTransaction.timestamp).toLocaleString()}
                </p>
                <p className="merchant-receipt-info">
                  {t.merchantId}: {merchantPublicKey}
                </p>
                <a
                  href={`https://sepolia.etherscan.io/tx/${currentTransaction.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="merchant-etherscan-link"
                >
                  View on Etherscan
                </a>
              </div>
            )}
            <div className="merchant-action-buttons">
              <button
                onClick={emailReceipt}
                className="merchant-button merchant-button-email"
              >
                {t.emailReceipt}
              </button>
              <button
                onClick={printRedemptionReceipt}
                className="merchant-button merchant-button-print"
              >
                {t.printReceipt}
              </button>
            </div>
            <button
              onClick={() => {
                setStep(2);
                setScannedPrivateKey("");
                setCurrentTransaction(null);
              }}
              className="merchant-button"
            >
              {t.newPayment}
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  const renderSettings = () => (
    <div className="merchant-settings">
      <h3 className="merchant-title">{t.settings}</h3>
      <div className="container2"></div>
      <div className="merchant-setting-item">
        <label htmlFor="currency" className="merchant-label">
          {t.currency}
        </label>
        <select
          id="currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="merchant-select"
        >
          <option value="NZD">NZD</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="GBP">GBP</option>
        </select>
      </div>
      <div className="merchant-setting-item">
        <label htmlFor="language" className="merchant-label">
          {t.language}
        </label>
        <select
          id="language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="merchant-select"
        >
          <option value="English">English</option>
          <option value="Spanish">Español</option>
          <option value="French">Français</option>
        </select>
      </div>
      <button
        onClick={() => {
          setShowCameraTest(true);
          setShowSettings(false);
        }}
        className="merchant-button"
      >
        {t.cameraTest}
      </button>
      <div className="container2"></div>
      <button
        onClick={() => setShowSettings(false)}
        className="merchant-button"
      >
        {t.saveSettings}
      </button>
    </div>
  );

  return (
    <div className="merchant-container">
      <div className="merchant-content">
        <div className="merchant-header">
          <h1 className="merchant-title">Skeuomorphia Merchant Terminal</h1>
          <button
            onClick={() => {
              setShowSettings(!showSettings);
              setShowCameraTest(false);
            }}
            className="merchant-settings-toggle"
          >
            {showSettings || showCameraTest ? t.back : t.settings}
          </button>
        </div>

        {showSettings ? (
          renderSettings()
        ) : showCameraTest ? (
          <CameraTest />
        ) : (
          <>
            <div className="merchant-steps">
              <div className="merchant-step-indicators">
                {[1, 2, 3, 4].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStep(s)}
                    className={`merchant-step-indicator ${
                      s === step ? "active" : ""
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {renderStep()}
            </div>

            {error && (
              <div className="merchant-error">
                <p>{error}</p>
              </div>
            )}

            <TransactionHistory
              transactions={transactionHistory}
              language={language}
              currency={currency}
            />
          </>
        )}
      </div>
    </div>
  );
}
