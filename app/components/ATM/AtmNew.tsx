import React, { useState, useEffect, useCallback } from "react";
import { useWeb3Auth } from "../../hooks/useWeb3Auth";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { Copy } from "lucide-react";
import AddressDisplay from "../../components/AddressDisplay";
import BalanceDisplay from "../../components/BalanceDisplay";
import BalanceScreen from "../BalanceScreen";
import AnimatedRetroLogo from "../AnimatedRetroLogo";
import BanknotePrinter from "../BanknotePrinter";
import DepositScreen from "../DepositScreen";
import StatementScreen from "../StatementScreen";
import {
  mintBanknote,
  getBanknoteInfo,
  getTokenBalance,
  getAllTokenBalances,
  getTokenAddresses,
  approveTokenSpending,
  web3auth,
  getTokenSymbol,
  generateAndSaveBanknotePDF,
} from "../../utils/web3";
import {
  screenDisconnected,
  screenMainMenu,
  screenWithdrawMenu,
  screenConfirm,
  screenMoreOptions,
  screenBalance,
  screenDeposit,
  screenWithdraw,
  screenStatement,
  screenInvest,
  screenCurrencies,
  screenSettings,
} from "../../data/menus";
import { Address } from "viem";
import { Screen } from "../../data/interfaces";
import { ActionEnum } from "../../data/action-enums";

interface MintInfo {
  id: number;
  denomination: number;
  tokenSymbol: string;
  txHash: string;
  timestamp: number;
}

export default function ATM() {
  const { isLoggedIn, address, balance, login, logout } = useWeb3Auth();
  const [screen, setScreen] = useState<Screen>(screenDisconnected);
  const [messageTop, setMessageTop] = useState<string>("");
  const [messageBottom, setMessageBottom] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showBanknotePrinter, setShowBanknotePrinter] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [mintHistory, setMintHistory] = useState<MintInfo[]>([]);
  const [currentStatementPage, setCurrentStatementPage] = useState(0);
  const [mintedBanknotes, setMintedBanknotes] = useState<
    Array<{ id: number; denomination: number; tokenSymbol: string }>
  >([]);
  const [balances, setBalances] = useState<{
    ETH: string;
    USDC: string;
    EURC: string;
    NZDT: string;
  }>({
    NZDT: "0 NZDT",
    USDC: "0 USDC",
    EURC: "0 EURC",
    ETH: "0 ETH",
  });
  const [currentToken, setCurrentToken] = useState<
    "ETH" | "USDC" | "EURC" | "NZDT"
  >("ETH");
  const [tokenAddresses, setTokenAddresses] = useState<{
    USDC: Address;
    EURC: Address;
    NZDT: Address;
    ETH: Address;
  }>({
    USDC: "0x" as Address,
    EURC: "0x" as Address,
    NZDT: "0x" as Address,
    ETH: "0x" as Address,
  });

  const CurrencyButton = ({ currency }: { currency: "USDC" | "EURC" | "NZDT" | "ETH" }) => (
    <button
      onClick={() => handleCurrencySelect(currency)}
      className={`currency-button ${currentToken === currency ? 'selected' : ''}`}
      style={{
        backgroundImage: `url(/images/${currency.toLowerCase()}.png)`,
        backgroundSize: 'cover',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        border: 'none',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '16px',
        fontWeight: 'bold',
        color: 'white',
        textShadow: '1px 1px 2px black',
        opacity: currentToken === currency ? 1 : 0.7,
      }}
    >
      {currency}
    </button>
  );

  useEffect(() => {
    const init = async () => {
      if (isLoggedIn && address) {
        setIsLoading(true);
        await fetchTokenAddresses();
        await getTokenBalances();
        setScreen(screenMainMenu);
        setIsLoading(false);
      }
    };
    init();
  }, [isLoggedIn, address]);

  const fetchTokenAddresses = async () => {
    const addresses = await getTokenAddresses();
    setTokenAddresses(addresses);
  };

  const handleCurrencySelect = (currency: "USDC" | "EURC" | "NZDT" | "ETH") => {
    setCurrentToken(currency);
  };

  const getTokenBalances = async () => {
    if (!address || !web3auth.provider) return;
    try {
      const allBalances = await getAllTokenBalances(
        web3auth.provider,
        address as Address
      );
      setBalances({
        ETH: `${allBalances.ETH} ETH`,
        USDC: `${allBalances.USDC} USDC`,
        EURC: `${allBalances.EURC} EURC`,
        NZDT: `${allBalances.NZDT} NZDT`,
      });
    } catch (error) {
      console.error("Error fetching token balances:", error);
      setMessageTop("Failed to fetch token balances. Please try again.");
    }
  };

  const handleTokenChange = useCallback(
    (token: "ETH" | "USDC" | "EURC" | "NZDT") => {
      setCurrentToken(token);
    },
    []
  );

  const handleMintBanknote = async (
    denomination: number,
    tokenSymbol: "USDC" | "EURC" | "NZDT" | "ETH"
  ) => {
    if (!web3auth.provider || !address) {
      setMessageTop("Please connect your wallet first.");
      return;
    }

    try {
      const tokenAddress = tokenAddresses[tokenSymbol];
      const amount = denomination.toString();

      setMessageTop(`Approving ${tokenSymbol} spending...`);
      const approvalTx = await approveTokenSpending(
        web3auth.provider,
        tokenAddress,
        amount
      );
      console.log(
        `${tokenSymbol} spending approved. Transaction: ${approvalTx}`
      );

      setMessageTop(`Minting ${denomination} ${tokenSymbol} banknote...`);
      const { txHash, id, privateKey } = await mintBanknote(
        web3auth.provider,
        tokenAddress,
        denomination
      );
      console.log(`Banknote minted with ID: ${id}, Transaction: ${txHash}`);

      await generateAndSaveBanknotePDF(
        denomination,
        tokenSymbol,
        id,
        privateKey
      );

      setMintedBanknotes((prevBanknotes) => [
        ...prevBanknotes,
        { id, denomination, tokenSymbol },
      ]);

      setScreen(screenMainMenu);
      setMessageTop(`Banknote minted successfully: ID ${id}`);
      await getTokenBalances();
    } catch (error) {
      console.error("Error minting banknote:", error);
      setMessageTop("Error minting banknote. Please try again.");
    }
  };

  const generateAndSaveBanknotePDF = async (
    denomination: number,
    tokenSymbol: string,
    id: number,
    privateKey: string
  ) => {
    const uniqueIdentifier = "";
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: [156, 66], // US currency size (156mm x 66mm)
    });

    // Add background image
    const img = new Image();
    img.src = "/banknote_1.png";
    doc.addImage(img, "PNG", 0, 0, 156, 66);

    // Add denomination and token name
    doc.setFontSize(24);
    doc.setTextColor(44, 62, 80); // Dark blue color
    doc.text(`${denomination} ${tokenSymbol}`, 156 - 42, 8 + 24 / 2, {
      align: "left",
      baseline: "middle",
    });

    // Add banknote ID
    doc.setFontSize(14);
    doc.text(`Banknote ID: ${id}`, 150, 70);

    // Generate QR code for private key
    const qr = await QRCode.toDataURL(privateKey);
    const qrSize = 36;
    doc.addImage(qr, "PNG", 156 - 9 - qrSize, 55 / 2, qrSize, qrSize);

    // Add private key text
    doc.setFontSize(6);
    doc.setTextColor(168, 168, 168);
    doc.text(`PK: ${privateKey}`, 10, 66 - 1, { maxWidth: 136 });

    //  // Add unique identifier
    //  doc.setFontSize(8);
    //  doc.setTextColor(44, 62, 80);
    //  doc.text(`Unique ID: ${uniqueIdentifier}`, 10, 66 - 10, { maxWidth: 136 });

    // Save the PDF
    doc.save(`banknote${id}_${denomination}${tokenSymbol}.pdf`);
  };

  const handlePrintBanknote = async (id: number) => {
    if (!web3auth.provider) {
      setMessageTop("Please connect your wallet first.");
      return;
    }

    try {
      const banknoteInfo = await getBanknoteInfo(web3auth.provider, id);
      const tokenSymbol = await getTokenSymbol(
        web3auth.provider,
        banknoteInfo.erc20 as Address
      );
      await generateAndSaveBanknotePDF(
        banknoteInfo.denomination,
        tokenSymbol,
        id,
        "Private key not available"
      );
      setMessageTop(`Banknote ${id} details saved as PDF`);
    } catch (error) {
      console.error("Error printing banknote:", error);
      setMessageTop("Error printing banknote. Please try again.");
    }
  };

  const playATMButtonSound = () => {
    const audio = new Audio("/atm-button-sound.wav");
    audio.play();
  };

  const handleButtonClick = async (action: ActionEnum) => {
    console.log("Action:", action);

    playATMButtonSound();

    switch (action) {
      case ActionEnum.PROCESS_LOGIN:
        await login();
        break;
      case ActionEnum.PROCESS_LOGOUT:
        await logout();
        setScreen(screenDisconnected);
        break;
      case ActionEnum.GO_WITHDRAW_MENU:
        setScreen(screenWithdrawMenu);
        setAmount(0);
        setMessageTop(`$ ${0}`);
        break;
      case ActionEnum.GO_MAIN_MENU:
        setScreen(screenMainMenu);
        setMessageTop("");
        setMessageBottom("");
        break;
      case ActionEnum.GO_MORE_OPTIONS:
        setScreen(screenMoreOptions);
        break;
      case ActionEnum.GO_BALANCE:
        setScreen(screenBalance);
        break;
      case ActionEnum.GO_DEPOSIT:
        setScreen(screenDeposit);
        break;
      case ActionEnum.GO_MOONPAY:
        window.open("https://www.moonpay.com/buy/usdc", "_blank");
        break;
      case ActionEnum.GO_WITHDRAW:
        setScreen(screenWithdraw);
        break;
      case ActionEnum.GO_STATEMENT:
        setScreen(screenStatement);
        break;
      case ActionEnum.PREVIOUS_STATEMENT_PAGE:
        setCurrentStatementPage((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case ActionEnum.NEXT_STATEMENT_PAGE:
        setCurrentStatementPage((prev) =>
          prev < Math.ceil(mintHistory.length / 10) - 1 ? prev + 1 : prev
        );
      case ActionEnum.GO_INVEST:
        setScreen(screenInvest);
        break;
      case ActionEnum.GO_CURRENCIES:
        setScreen(screenCurrencies);
        break;
      case ActionEnum.GO_SETTINGS:
        setScreen(screenSettings);
        break;
      case ActionEnum.GO_DEPOSIT:
        setScreen(screenDeposit);
        break;
      case ActionEnum.PRINT_TEST_BANKNOTE:
        setShowBanknotePrinter(true);
        break;
      case ActionEnum.PROCESS_WITHDRAW_100:
      case ActionEnum.PROCESS_WITHDRAW_50:
      case ActionEnum.PROCESS_WITHDRAW_20:
      case ActionEnum.PROCESS_WITHDRAW_10:
      case ActionEnum.PROCESS_WITHDRAW_5:
      case ActionEnum.PROCESS_WITHDRAW_2:
        const withdrawAmount = [100, 50, 20, 10, 5, 2][
          action - ActionEnum.PROCESS_WITHDRAW_100
        ];
        setAmount(withdrawAmount);
        setScreen(screenConfirm);
        setMessageTop(`Confirm to print banknote worth`);
        break;
      case ActionEnum.MINT_USDC:
      case ActionEnum.MINT_EURC:
      case ActionEnum.MINT_NZDT:
      case ActionEnum.MINT_ETH:
        const tokenSymbol = ["USDC", "EURC", "NZDT", "ETH"][
          action - ActionEnum.MINT_USDC
        ] as "USDC" | "EURC" | "NZDT" | "ETH";
        await handleMintBanknote(amount, tokenSymbol);
        break;
      case ActionEnum.EXECUTE_WITHDRAW:
        console.log("Withdraw:", amount);
        await handleMintBanknote(
          amount,
          currentToken as "USDC" | "EURC" | "NZDT" | "ETH"
        );
        setScreen(screenMainMenu);
        setAmount(0);
        setMessageTop("");
        break;
      case ActionEnum.CANCEL_WITHDRAW:
        setScreen(screenMainMenu);
        setAmount(0);
        setMessageTop("");
        break;
      case ActionEnum.PRINT_BANKNOTE:
        if (selectedBanknote) {
          await handlePrintBanknote(selectedBanknote.id);
        }
        break;
    }
  }

  const [selectedBanknoteIndex, setSelectedBanknoteIndex] = useState(0);
  const selectedBanknote = mintedBanknotes[selectedBanknoteIndex];

  const copyAddressToClipboard = () => {
    navigator.clipboard.writeText(address).then(() => {
      alert("Address copied to clipboard!");
    });
  };

  return (
    <div className="container">
      <div className="flex-left">
        {screen.options.map((item, index) => (
          <div
            key={`left-${index}`}
            className="button2"
            onClick={() => handleButtonClick(item.left.actionId)}
          >
            {" "}
          </div>
        ))}
      </div>
      <div className="flex">
        {screen.options.map((item, index) => (
          <div
            key={`right-${index}`}
            className="button1"
            onClick={() => handleButtonClick(item.right.actionId)}
          >
            {" "}
          </div>
        ))}
      </div>
      <div className="computer-container">
        <div className="monitor">
          <div className="monitor-inner">
            <div className="screen-container">
              <div
                className="screen"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  padding: "20px",
                  boxSizing: "border-box",
                  fontSize: "28px",
                }}
              >
                {alertMessage && (
                  <div className="alert-message">{alertMessage}</div>
                )}

                <h2
                  style={{
                    textAlign: "center",
                    marginTop: "0px",
                    fontSize: "42px",
                  }}
                >
                  {screen.title}
                  {!isLoggedIn && <AnimatedRetroLogo />}
                </h2>

                {isLoading ? (
                  <div className="loader"></div>
                ) : (
                  <>
                    {address && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginTop: "-30px",
                        }}
                      >
                        <BalanceDisplay
                          address={address}
                          balances={balances}
                          currentToken={currentToken}
                          onTokenChange={handleTokenChange}
                        />
                        {/* <Copy
                          size={32}
                          onClick={copyAddressToClipboard}
                          style={{ marginLeft: "5px", cursor: "pointer" }}
                        /> */}
                      </div>
                    )}

                    {messageTop && (
                      <p style={{ textAlign: "center", fontSize: "18px" }}>
                        {messageTop}
                      </p>
                    )}

                    {screen === screenDeposit && (
                      <DepositScreen
                        address={address}
                        balances={balances}
                        currentToken={currentToken}
                        onTokenChange={handleTokenChange}
                      />
                    )}

                    {screen === screenBalance && (
                      <BalanceScreen
                        address={address}
                        balances={balances}
                        currentToken={currentToken}
                        onTokenChange={handleTokenChange}
                      />
                    )}

                    {screen === screenStatement && (
                      <StatementScreen
                        mintHistory={mintHistory}
                        currentPage={currentStatementPage}
                      />
                    )}

{screen === screenConfirm && (
                      <div style={{ textAlign: "center" }}>
                        <p style={{ fontSize: "48px", fontWeight: "bold", margin: "10px 0" }}>
                          {amount} {currentToken || ""}
                        </p>
                        <div style={{ display: "flex", justifyContent: "space-around", margin: "20px 0" }}>
                          <CurrencyButton currency="USDC" />
                          <CurrencyButton currency="EURC" />
                          <CurrencyButton currency="NZDT" />
                          <CurrencyButton currency="ETH" />
                        </div>
                      </div>
                    )}

                    {showBanknotePrinter && (
                      <BanknotePrinter
                        onClose={() => setShowBanknotePrinter(false)}
                        onPrint={() =>
                          handleButtonClick(ActionEnum.EXECUTE_PRINT_BANKNOTE)
                        }
                      />
                    )}
                    <div
                      style={{
                        flexGrow: 1,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        padding: "10px 0",
                        fontSize: "32px",
                      }}
                    >
                      {screen.options.map((item, index) => (
                        <div
                          key={`option-${index}`}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            width: "100%",
                            marginBottom: "5px",
                          }}
                        >
                          <span style={{ textAlign: "left" }}>
                            {item.left.message}
                          </span>
                          <span style={{ textAlign: "right" }}>
                            {item.right.message}
                          </span>
                        </div>
                      ))}
                    </div>
                    {messageBottom && (
                      <p style={{ textAlign: "center" }}>{messageBottom}</p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}