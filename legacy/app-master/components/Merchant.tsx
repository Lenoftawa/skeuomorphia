"use client";

import React, { useState, useEffect } from "react";
import QRScanner from "./QRScanner";
import TransactionHistory from "./TransactionHistory";
import CameraTest from "./CameraTest";
import { Transaction } from "../types";
import { redeemToken, getTokenBalance, fetchTokenAddresses } from "../utils/web3";
import { ethers } from 'ethers';

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
  }>({ USDC: "", EURC: "" });
  const [selectedToken, setSelectedToken] = useState<"USDC" | "EURC">("USDC");
  const [tokenAddresses, setTokenAddresses] = useState<{
    USDC: string;
    EURC: string;
  }>({ USDC: "", EURC: "" });
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
    async function fetchTokenAddresses() {
      const addresses = await fetchTokenAddresses();
      setTokenAddresses(addresses);
    }
    fetchTokenAddresses();
  }, []);

  // const handleScan = async (data: string) => {
  //   try {
  //     const balance = await simulateGetPaperWalletBalance(data);
  //     const newWallet: ScannedWallet = { privateKey: data, balance };
  //     setScannedWallets((prev) => [...prev, newWallet]);
  //     setTotalBalance((prev) => prev + balance);
  //     setShowConfirmation(true);
  //     setTimeout(() => setShowConfirmation(false), 1000);
  //   } catch (error) {
  //     setError((error as Error).message);
  //   }
  // };

  // const handleRedeem = async () => {
  //   setIsLoading(true);
  //   setError(null);
  //   try {
  //     const result = await simulateRedeemPaperWallets(
  //       scannedWallets,
  //       merchantPublicKey
  //     );
  //     const newTransaction: Transaction = {
  //       amount: result.amount,
  //       txHash: result.txHash,
  //       timestamp: new Date().toISOString(),
  //     };
  //     setCurrentTransaction(newTransaction);
  //     setTransactionHistory((prev) => [newTransaction, ...prev]);
  //     setRedeemStatus("Payment received successfully!");
  //     setScannedWallets([]);
  //     setTotalBalance(0);
  //     setStep(4);
  //   } catch (error) {
  //     setError((error as Error).message);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const handleScan = async (data: string) => {
    try {
      setScannedPrivateKey(data);
      const wallet = new ethers.Wallet(data);
      const usdcBalance = await getTokenBalance(wallet.address, tokenAddresses.USDC);
      const eurcBalance = await getTokenBalance(wallet.address, tokenAddresses.EURC);
      setScannedBalances({ USDC: usdcBalance, EURC: eurcBalance });
      setShowConfirmation(true);
    } catch (error) {
      setError((error as Error).message);
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
      const result = await redeemToken(manualPrivateKey, parseInt(manualBanknoteId));
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

  const handleRedeem = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await redeemToken(scannedPrivateKey, parseInt(manualBanknoteId));
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
      setScannedBalances({ USDC: "", EURC: "" });
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

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <label
              htmlFor="merchantKey"
              className="block text-sm font-medium text-gray-700"
            >
              {t.merchantIdLabel}
            </label>
            <input
              id="merchantKey"
              type="text"
              value={merchantPublicKey}
              onChange={(e) => setMerchantPublicKey(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder={t.merchantIdLabel}
            />
            <button
              onClick={() => setStep(2)}
              disabled={!merchantPublicKey}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {t.next}
            </button>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Scan or Enter Private Key</h3>
            {cameraPermission === false && (
              <p className="text-sm text-red-600">
                Please enable camera permissions to scan QR codes.
              </p>
            )}
            <QRScanner onScan={handleScan} onError={(err) => setError(err)} />
            <div className="mt-4">
              <label
                htmlFor="manualBanknoteId"
                className="block mt-2 text-sm font-medium text-gray-700"
              >
                Enter banknote ID:
              </label>
              <input
                type="number"
                id="manualBanknoteId"
                value={manualBanknoteId}
                onChange={(e) => setManualBanknoteId(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter banknote ID"
              />
              <button
                onClick={handleManualRedeem}
                className="mt-2 w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Submit Private Key
              </button>
            </div>
            {showConfirmation && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-green-600 font-bold">
                    Private Key Received!
                  </p>
                </div>
              </div>
            )}
            {scannedPrivateKey && (
              <div className="flex items-center space-x-2">
                <span>Private Key Received</span>
                <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
              </div>
            )}
            <button
              onClick={() => setStep(3)}
              disabled={!scannedPrivateKey}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Review and Submit
            </button>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              Review and Confirm Redemption
            </h3>
            <div className="bg-gray-100 p-4 rounded-md">
              <div className="flex justify-between items-center mb-2">
                <span>USDC Balance</span>
                <span>{scannedBalances.USDC}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span>EURC Balance</span>
                <span>{scannedBalances.EURC}</span>
              </div>
            </div>
            <select
              value={selectedToken}
              onChange={(e) =>
                setSelectedToken(e.target.value as "USDC" | "EURC")
              }
              className="block w-full mt-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            >
              <option value="USDC">USDC</option>
              <option value="EURC">EURC</option>
            </select>
            <button
              onClick={handleRedeem}
              disabled={isLoading}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isLoading ? "Processing..." : `Redeem ${selectedToken}`}
            </button>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-green-600">
              {t.paymentComplete}
            </h3>
            {currentTransaction && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <h4 className="text-lg font-medium mb-2">Payment Receipt</h4>
                <p className="text-sm text-green-800">
                  {t.amount}: {currentTransaction.amount.toFixed(2)}{" "}
                  {currentTransaction.tokenSymbol}
                </p>
                <p className="text-xs text-green-600">
                  {t.transactionId}: {currentTransaction.txHash}
                </p>
                <p className="text-xs text-green-600">
                  {t.date}:{" "}
                  {new Date(currentTransaction.timestamp).toLocaleString()}
                </p>
                <p className="text-xs text-green-600">
                  {t.merchantId}: {merchantPublicKey}
                </p>
                <a
                  href={`https://sepolia.etherscan.io/tx/${currentTransaction.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline"
                >
                  View on Etherscan
                </a>
              </div>
            )}
            <div className="flex space-x-2">
              <button
                onClick={emailReceipt}
                className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {t.emailReceipt}
              </button>
              <button
                onClick={printReceipt}
                className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
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
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
    <div className="space-y-4">
      <h3 className="text-lg font-medium">{t.settings}</h3>
      <div>
        <label
          htmlFor="currency"
          className="block text-sm font-medium text-gray-700"
        >
          {t.currency}
        </label>
        <select
          id="currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="NZD">NZD</option>
          <option value="EUR">USD</option>
          <option value="EUR">EUR</option>
          <option value="GBP">GBP</option>
        </select>
      </div>
      <div>
        <label
          htmlFor="language"
          className="block text-sm font-medium text-gray-700"
        >
          {t.language}
        </label>
        <select
          id="language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
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
        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        {t.cameraTest}
      </button>
      <button
        onClick={() => setShowSettings(false)}
        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        {t.saveSettings}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto w-full px-4 sm:px-0">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-light-blue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-xl font-semibold">
                Skeuomorphia Merchant Terminal
              </h1>
              <button
                onClick={() => {
                  setShowSettings(!showSettings);
                  setShowCameraTest(false);
                }}
                className="text-sm text-indigo-600 hover:text-indigo-500"
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
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    {[1, 2, 3, 4].map((s) => (
                      <button
                        key={s}
                        onClick={() => setStep(s)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          s === step
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-200 text-gray-600"
                        } hover:bg-indigo-500 hover:text-white transition-colors duration-200`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  {renderStep()}
                </div>

                {error && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{error}</p>
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
      </div>
    </div>
  );
}
