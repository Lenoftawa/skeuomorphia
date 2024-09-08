"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useWeb3Auth } from "../hooks/useWeb3Auth";
import QRScanner from "./QRScanner";
import CameraTest from "./CameraTest";
import TransactionHistory from "./TransactionHistory";
import { Transaction } from "../types";
import AddressDisplay from "./AddressDisplay";
import {
  redeemBanknote,
  getTokenBalance,
  getTokenAddresses,
  web3auth,
  getBalancesForPrivateKey,
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
  const { isLoggedIn, address, balance, login, logout } = useWeb3Auth();
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
  const [scannedValue, setScannedValue] = useState("");
  const [scannedAddress, setScannedAddress] = useState<string>("");
  const [scannedBalances, setScannedBalances] = useState<{
    ETH: string;
    USDC: string;
    EURC: string;
    NZDT: string;
  }>({ ETH: "0", USDC: "0", EURC: "0", NZDT: "0" });
  const [currentToken, setCurrentToken] = useState<string>("NZDT");
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
  const [manualPrivateKeyBalances, setManualPrivateKeyBalances] = useState<{
    ETH: string;
    USDC: string;
    EURC: string;
    NZDT: string;
  } | null>(null);
  const [manualBanknoteId, setManualBanknoteId] = useState("");

  const t = translations[language as keyof typeof translations];

  useEffect(() => {
    if (isLoggedIn && address) {
      setStep(2);
    } else {
      setStep(1);
    }
  }, [isLoggedIn, address]);

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
    setScannedValue(data);
    setIsLoading(true);
    setError(null);
    try {
      if (!data) {
        throw new Error("No scanned value available");
      }

      const privateKeyHex = data.startsWith("0x") ? data : `0x${data}`;

      // if (!ethers.utils.isHexString(privateKeyHex, 32)) {
      //   throw new Error("Invalid private key format");
      // }

      setScannedPrivateKey(privateKeyHex);

      // Get the address from the private key
      const wallet = new ethers.Wallet(privateKeyHex);
      setScannedAddress(wallet.address);

      // Fetch balances for the address
      const balances = await getBalancesForPrivateKey(privateKeyHex);
      setScannedBalances(balances);

      setStep(3);
    } catch (error) {
      console.error("Error in handleScan:", error);
      setError(`Error processing scanned value: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTokenChange = (token: string) => {
    setCurrentToken(token);
  };

  const handleProceed = async () => {
    console.log("handleProceed called with scanned value:", scannedValue);
    setIsLoading(true);
    setError(null);
    try {
      if (!scannedValue) {
        throw new Error("No scanned value available");
      }
  
      console.log("Converting scanned value to hex...");
      // Convert scanned value to hex if it's not already
      const privateKeyHex = scannedValue.startsWith("0x") ? scannedValue : `0x${scannedValue}`;
      console.log("Converted private key:", privateKeyHex);
  
      // Check if ethers is properly imported and available
      if (typeof ethers === 'undefined') {
        console.error("ethers is not defined. Make sure it's properly imported.");
        throw new Error("ethers library is not available");
      }
  
      console.log("Checking if private key is valid hex string...");
      if (!ethers.utils.isHexString(privateKeyHex, 32)) {
        console.error("Invalid private key format:", privateKeyHex);
        throw new Error("Invalid private key format");
      }
  
      console.log("Setting scanned private key...");
      setScannedPrivateKey(privateKeyHex);
  
      console.log("Fetching balances for private key...");
      const balances = await getBalancesForPrivateKey(privateKeyHex);
      console.log("Fetched balances:", balances);
  
      setScannedBalances(balances);
      setStep(3);
    } catch (error) {
      console.error("Error in handleProceed:", error);
      setError(`Error processing scanned value: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRedeem = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const wallet = new ethers.Wallet(manualPrivateKey);
      const banknoteId = parseInt(wallet.address.slice(2), 16);

      // Fetch balances here in step 3
      const balances = await getBalancesForPrivateKey(manualPrivateKey);
      setManualPrivateKeyBalances(balances);

      const tokenSymbol = Object.keys(balances).find(
        (key) => balances[key as keyof typeof balances] !== "0"
      ) as "USDC" | "EURC" | "NZDT" | "ETH";
      
      if (!tokenSymbol) {
        throw new Error("No balance found for redemption");
      }

      const amount = ethers.utils.parseUnits(balances[tokenSymbol].split(' ')[0], 18);

      const messageHash = ethers.utils.solidityKeccak256(
        ["address", "uint256"],
        [address, amount]
      );
      const messageBytes = ethers.utils.arrayify(messageHash);
      const signature = await wallet.signMessage(messageBytes);

      // Use a properly formatted description (64 hex digits)
      const description = "0x626c756500000000000000000000000000000000000000000000000000000000";

      const result = await redeemBanknote(
        web3auth.provider!,
        banknoteId,
        amount,
        signature,
        description
      );

      const newTransaction = {
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
      setManualPrivateKeyBalances(null);
      setStep(4);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // const handleScan = async (data: string) => {
  //   try {
  //     setScannedPrivateKey(data);
  //     const wallet = new ethers.Wallet(data);

  //     if (!web3auth.provider) {
  //       throw new Error("Web3Auth provider not available");
  //     }

  //     const usdcBalance = await getTokenBalance(web3auth.provider, wallet.address as Address, tokenAddresses.USDC);
  //     const eurcBalance = await getTokenBalance(web3auth.provider, wallet.address as Address, tokenAddresses.EURC);
  //     const nzdtBalance = await getTokenBalance(web3auth.provider, wallet.address as Address, tokenAddresses.NZDT);

  //     setScannedBalances({
  //       USDC: usdcBalance,
  //       EURC: eurcBalance,
  //       NZDT: nzdtBalance,
  //     });
  //     setShowConfirmation(true);
  //     setStep(3); // Automatically move to the confirmation step
  //   } catch (error) {
  //     setError((error as Error).message);
  //   }
  // };

  // const handleRedeem = async () => {
  //   setIsLoading(true);
  //   setError(null);
  //   try {
  //     if (!web3auth.provider) {
  //       throw new Error("Web3Auth provider not available");
  //     }

  //     const result = await redeemBanknote(
  //       web3auth.provider,
  //       parseInt(manualBanknoteId),
  //       BigInt(scannedBalances[selectedToken]), // Convert to BigInt
  //       "0x" as `0x${string}`, // Placeholder for signature
  //       "Redemption" // Placeholder for description
  //     );

  //     const newTransaction: Transaction = {
  //       amount: parseFloat(result.amount),
  //       txHash: result.txHash,
  //       timestamp: new Date().toISOString(),
  //       tokenSymbol: result.tokenSymbol,
  //     };
  //     setCurrentTransaction(newTransaction);
  //     setTransactionHistory((prev) => [newTransaction, ...prev]);
  //     setRedeemStatus(
  //       `Payment of ${result.amount} ${result.tokenSymbol} received successfully!`
  //     );
  //     setScannedPrivateKey("");
  //     setScannedBalances({ USDC: "", EURC: "", NZDT: "" });
  //     setStep(4);
  //   } catch (error) {
  //     setError((error as Error).message);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const handleManualRedeem = async () => {
    if (
      !ethers.isHexString(manualPrivateKey) ||
      manualPrivateKey.length !== 66
    ) {
      setError("Invalid private key format");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // Move to step 3 without fetching balances yet
      setStep(3);
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
    doc.text("Skeuomorphica Bank", 105, 20, { align: "center" });

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
    doc.text("Thank you for using Skeuomorphica Bank", 105, 280, {
      align: "center",
    });

    // Save the PDF
    doc.save(`redemption_receipt_${currentTransaction.txHash.slice(0, 6)}.pdf`);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="welcome-step">
            <h1>Welcome to Skeuomorphia Merchant Portal</h1>
            <p>Securely redeem banknotes and manage transactions with ease.</p>
            <button onClick={login} className="signin-button">
              Sign In with Web3Auth
            </button>
          </div>
        );
      case 2:
        return (
          <div className="merchant-step">
            <h3 className="merchant-subtitle">
              Scan Banknote or Enter Private Key
            </h3>
            <QRScanner onScan={handleScan} onError={(err) => setError(err)} />
            {scannedValue && (
              <button onClick={handleProceed} className="proceed-button">
                Confirm and Proceed
              </button>
            )}
 <div className="merchant-manual-input">
              <label htmlFor="manualPrivateKey" className="merchant-label">
                Enter private key:
              </label>
              <input
                type="text"
                id="manualPrivateKey"
                value={manualPrivateKey}
                onChange={(e) => setManualPrivateKey(e.target.value)}
                className="merchant-input"
                placeholder="Enter private key"
              />
              <button onClick={handleManualRedeem} className="merchant-button">
                Proceed with Manual Redemption
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
              {manualPrivateKeyBalances ? (
              <div className="merchant-balance-info">
                {Object.entries(manualPrivateKeyBalances).map(([token, balance]) => (
                  <div key={token} className={`balance-item ${balance === "0" ? "zero-balance" : ""}`}>
                    <span>
                      Balance: {balance}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p>Loading balances...</p>
            )}
                {Object.entries(scannedBalances).map(([token, balance]) => (
                  <div
                    key={token}
                    className={`balance-item ${
                      balance === "0" ? "zero-balance" : ""
                    }`}
                  >
       {scannedAddress && (
              <AddressDisplay
                address={scannedAddress}
                balances={scannedBalances}
                currentToken={currentToken}
                onTokenChange={handleTokenChange}
              />
            )}
                    <span>
                     Balance: {balance} {token}
                    </span>
                  </div>
                ))}
              </div>
  
              <button
                onClick={handleRedeem}
                disabled={isLoading}
                className="merchant-button merchant-button-redeem"
              >
                {isLoading ? "Processing..." : "Redeem"}
              </button>
              {redeemStatus && <p className="redeem-status">{redeemStatus}</p>}
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
        <div className="merchant-address">
          <p>Merchant Address: {address}</p>
        </div>
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
      <div className="container2"></div>
      <button
        onClick={() => {
          logout();
          setStep(1);
          setShowSettings(false);
        }}
        className="merchant-button merchant-button-logout"
      >
        Logout
      </button>
    </div>
  );

  return (
    <div className="merchant-container">
      <div className="merchant-content">
        <div className="merchant-header">
          <h1 className="merchant-title">Skeuomorphia Merchant Terminal</h1>
          {isLoggedIn && (
            <button
              onClick={() => {
                setShowSettings(!showSettings);
                setShowCameraTest(false);
              }}
              className="merchant-settings-toggle"
            >
              {showSettings || showCameraTest ? t.back : t.settings}
            </button>
          )}
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
                    onClick={() => isLoggedIn && s !== 1 && setStep(s)}
                    className={`merchant-step-indicator ${
                      s === step ? "active" : ""
                    } ${s === 1 && isLoggedIn ? "disabled" : ""}`}
                    disabled={s === 1 && isLoggedIn}
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
