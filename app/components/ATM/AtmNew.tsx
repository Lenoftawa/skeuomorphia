import React, { useState, useEffect, useCallback } from "react";
import { useWeb3Auth } from "../../hooks/useWeb3Auth";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { Copy } from "lucide-react";
import AddressDisplay from "../../components/AddressDisplay";
import AnimatedRetroLogo from "../AnimatedRetroLogo";
import BanknotePrinter from "../BanknotePrinter";
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

export default function ATM() {
  const { isLoggedIn, address, balance, login, logout } = useWeb3Auth();
  const [screen, setScreen] = useState<Screen>(screenDisconnected);
  const [messageTop, setMessageTop] = useState<string>("");
  const [messageBottom, setMessageBottom] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showBanknotePrinter, setShowBanknotePrinter] = useState(false);
  const [mintedBanknotes, setMintedBanknotes] = useState<
    Array<{ id: number; denomination: number; tokenSymbol: string }>
  >([]);
  const [balances, setBalances] = useState<{
    ETH: string;
    USDC: string;
    EURC: string;
    NZDT: string;
  }>({
    ETH: "0 ETH",
    USDC: "0 USDC",
    EURC: "0 EURC",
    NZDT: "0 NZDT",
  });
  const [currentToken, setCurrentToken] = useState<"ETH" | "USDC" | "EURC" | "NZDT">("ETH");
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

  const handleTokenChange = useCallback((token: "ETH" | "USDC" | "EURC" | "NZDT") => {
    setCurrentToken(token);
  }, []);

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
    const doc = new jsPDF();

    // Add background image
    const img = new Image();
    img.src = "/banknote_1.png";
    doc.addImage(img, "PNG", 0, 0, 210, 297);

    // Add denomination and token name
    doc.setFontSize(24);
    doc.setTextColor(0, 0, 0);
    doc.text(`${denomination} ${tokenSymbol}`, 150, 50);

    // Add banknote ID
    doc.setFontSize(14);
    doc.text(`Banknote ID: ${id}`, 150, 70);

    // Generate QR code for private key
    const qr = await QRCode.toDataURL(privateKey);
    doc.addImage(qr, "PNG", 150, 90, 40, 40);

    // Add private key text
    doc.setFontSize(10);
    doc.text(`Private Key: ${privateKey}`, 150, 140, { maxWidth: 50 });

    // Save the PDF
    doc.save(`banknote_${id}.pdf`);
  };

  const handleViewBanknotes = () => {
    setScreen(screenBanknotes);
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

  const handleButtonClick = async (action: ActionEnum) => {
    console.log("Action:", action);

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
      case ActionEnum.GO_WITHDRAW:
        setScreen(screenWithdraw);
        break;
      case ActionEnum.GO_STATEMENT:
        setScreen(screenStatement);
        break;
      case ActionEnum.GO_INVEST:
        setScreen(screenInvest);
        break;
      case ActionEnum.GO_CURRENCIES:
        setScreen(screenCurrencies);
        break;
      case ActionEnum.GO_SETTINGS:
        setScreen(screenSettings);
        break;
      case ActionEnum.PRINT_TEST_BANKNOTE:
        setShowBanknotePrinter(true);
        break;
        case ActionEnum.EXECUTE_PRINT_BANKNOTE:
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
        setMessageTop(`Printing a note for ${withdrawAmount} ${currentToken}`);
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
      case ActionEnum.VIEW_BANKNOTES:
        handleViewBanknotes();
        break;
      case ActionEnum.PRINT_BANKNOTE:
        if (selectedBanknote) {
          await handlePrintBanknote(selectedBanknote.id);
        }
        break;
    }
  };

  const screenBanknotes: Screen = {
    title: "Your Banknotes",
    options: [
      {
        left: { message: "Select", actionId: ActionEnum.SELECT_BANKNOTE },
        right: { message: "Print", actionId: ActionEnum.PRINT_BANKNOTE },
      },
      {
        left: { message: "Previous", actionId: ActionEnum.PREVIOUS_BANKNOTE },
        right: { message: "Next", actionId: ActionEnum.NEXT_BANKNOTE },
      },
      {
        left: { message: "", actionId: ActionEnum.NO_ACTION },
        right: { message: "", actionId: ActionEnum.NO_ACTION },
      },
      {
        left: { message: "<Back", actionId: ActionEnum.GO_MAIN_MENU },
        right: { message: "", actionId: ActionEnum.NO_ACTION },
      },
    ],
  };

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
                          marginBottom: "-26px",
                        }}
                      >
                        <AddressDisplay
                          address={address}
                          balances={balances}
                          currentToken={currentToken}
                          onTokenChange={handleTokenChange}
                        />
                        <Copy
                          size={32}
                          onClick={copyAddressToClipboard}
                          style={{ marginLeft: "5px", cursor: "pointer" }}
                        />
                      </div>
                    )}
                    <h2
                      style={{
                        textAlign: "center",
                        marginBottom: "10px",
                        fontSize: "42px",
                      }}
                    >
                      {screen.title}
                      {!isLoggedIn && <AnimatedRetroLogo />}
                    </h2>

                    {messageTop && (
                      <p style={{ textAlign: "center", fontSize: "32px" }}>
                        {messageTop}
                      </p>
                    )}
                    {screen === screenConfirm && (
                      <div>
                        <p>Select token to mint {amount} banknote:</p>
                        <button
                          onClick={() =>
                            handleButtonClick(ActionEnum.MINT_USDC)
                          }
                        >
                          USDC
                        </button>
                        <button
                          onClick={() =>
                            handleButtonClick(ActionEnum.MINT_EURC)
                          }
                        >
                          EURC
                        </button>
                        <button
                          onClick={() =>
                            handleButtonClick(ActionEnum.MINT_NZDT)
                          }
                        >
                          NZDT
                        </button>
                        <button
                          onClick={() => handleButtonClick(ActionEnum.MINT_ETH)}
                        >
                          ETH
                        </button>
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
