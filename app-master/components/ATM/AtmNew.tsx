"use client";

import React, { useState, useEffect } from "react";
import { Web3Auth } from "@web3auth/modal";
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import RPC from "../../data/viemRPC";
import jsPDF from "jspdf";
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
import { Screen } from "../../data/interfaces";
import { ActionEnum } from "../../data/action-enums";
import AddressDisplay from "../../components/AddressDisplay";
import { printBanknote } from "../../utils/printPDF";
import { Copy } from "lucide-react";
import AnimatedRetroLogo from "../AnimatedRetroLogo";
import { ethers } from "ethers";
import {
  mintBanknote,
  redeemBanknote,
  skimSurplus,
  getBanknoteInfo,
  getSurplus,
  getNextId,
  getTokenBalance,
  getTokenAddresses,
  approveTokenSpending,
} from "../../utils/web3";

const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID || "";

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0xaa36a7",
  rpcTarget: "https://rpc.ankr.com/eth_sepolia",
  displayName: "Ethereum Sepolia Testnet",
  blockExplorerUrl: "https://sepolia.etherscan.io",
  ticker: "ETH",
  tickerName: "Ethereum",
};

const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: { chainConfig },
});

const web3auth = new Web3Auth({
  clientId,
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
  privateKeyProvider,
});

export default function AtmNew() {
  const [screen, setScreen] = useState<Screen>(screenDisconnected);
  const [messageTop, setMessageTop] = useState<string>("");
  const [messageBottom, setMessageBottom] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);
  const [loggedIn, setLoggedIn] = useState(false);
  const [address, setAddress] = useState<string>("");
  const [balance, setBalance] = useState<string>("");
  const [usdcBalance, setUsdcBalance] = useState<string>("");
  const [eurcBalance, setEurcBalance] = useState<string>("");
  const [tokenAddresses, setTokenAddresses] = useState<{
    USDC: string;
    EURC: string;
  }>({ USDC: "", EURC: "" });
  const [mintedBanknotes, setMintedBanknotes] = useState<
    Array<{ id: number; denomination: number; tokenSymbol: string }>
  >([]);

  useEffect(() => {
    const init = async () => {
      try {
        await web3auth.initModal();
        if (web3auth.connected) {
          setLoggedIn(true);
          await getUserInfo();
          await getAccounts();
          await getBalance();
          await getTokenBalances();
          await fetchTokenAddresses();
          setScreen(screenMainMenu);
        }
      } catch (error) {
        console.error(error);
      }
    };

    init();
  }, []);

  const login = async () => {
    try {
      await web3auth.connect();
      setLoggedIn(true);
      await getUserInfo();
      await getAccounts();
      await getBalance();
      setScreen(screenMainMenu);
    } catch (error) {
      console.error(error);
    }
  };

  const logout = async () => {
    await web3auth.logout();
    setLoggedIn(false);
    setAddress("");
    setBalance("");
    setScreen(screenDisconnected);
    setMessageTop("");
    setMessageBottom("");
  };

  const getUserInfo = async () => {
    const user = await web3auth.getUserInfo();
    console.log(user);
  };

  const getAccounts = async () => {
    if (!web3auth.provider) {
      console.log("provider not initialized yet");
      return;
    }
    const address = await RPC.getAccounts(web3auth.provider);
    setAddress(address);
  };

  const getBalance = async () => {
    if (!web3auth.provider) {
      console.log("provider not initialized yet");
      return;
    }
    const balance = await RPC.getBalance(web3auth.provider);
    setBalance(balance);
  };

  const getTokenBalances = async () => {
    if (!address) return;
    const { USDC, EURC } = await getTokenAddresses();
    const usdcBalance = await getTokenBalance(address, USDC);
    const eurcBalance = await getTokenBalance(address, EURC);
    setUsdcBalance(usdcBalance);
    setEurcBalance(eurcBalance);
  };

  const fetchTokenAddresses = async () => {
    const addresses = await getTokenAddresses();
    setTokenAddresses(addresses);
  };

  const handleMintBanknote = async (
    denomination: number,
    tokenSymbol: "USDC" | "EURC"
  ) => {
    try {
      const tokenAddress =
        tokenSymbol === "USDC" ? tokenAddresses.USDC : tokenAddresses.EURC;
      const amount = ethers.parseUnits(denomination.toString(), 6); // Assuming 6 decimals for both USDC and EURC

      // Step 1: Approve spending
      setMessageTop(`Approving ${tokenSymbol} spending...`);
      const approvalTx = await approveTokenSpending(
        tokenAddress,
        amount.toString()
      );
      console.log(
        `${tokenSymbol} spending approved. Transaction: ${approvalTx}`
      );

      // Step 2: Mint banknote
      setMessageTop(`Minting ${denomination} ${tokenSymbol} banknote...`);
      const wallet = ethers.Wallet.createRandom();
      const { txHash, id } = await mintBanknote(
        tokenAddress,
        wallet.address,
        denomination
      );
      console.log(`Banknote minted with ID: ${id}, Transaction: ${txHash}`);

      // Step 3: Generate and save PDF
      await generateAndSaveBanknotePDF(
        denomination,
        tokenSymbol,
        id,
        wallet.privateKey
      );

      // Update minted banknotes list
      setMintedBanknotes((prevBanknotes) => [
        ...prevBanknotes,
        { id, denomination, tokenSymbol },
      ]);

      setScreen(screenMainMenu);
      setMessageTop(`Banknote minted successfully: ID ${id}`);
      await getTokenBalances(); // Refresh token balances
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

    doc.setFontSize(16);
    doc.text("Banknote Details", 10, 10);

    doc.setFontSize(12);
    doc.text(`Denomination: ${denomination} ${tokenSymbol}`, 10, 20);
    doc.text(`ID: ${id}`, 10, 30);
    doc.text(`Private Key: ${privateKey}`, 10, 40);

    doc.setFontSize(10);
    doc.text("IMPORTANT: Keep this information secret and safe.", 10, 60);
    doc.text("You'll need the private key to redeem the banknote.", 10, 70);

    doc.save(`banknote_${id}.pdf`);
  };

  const handleViewBanknotes = () => {
    setScreen(screenBanknotes);
  };

  const handlePrintBanknote = async (id: number) => {
    try {
      const banknoteInfo = await getBanknoteInfo(id);
      await generateAndSaveBanknotePDF(
        banknoteInfo.denomination,
        banknoteInfo.tokenSymbol,
        id,
        "Private key not available"
      );
      setMessageTop(`Banknote ${id} details saved as PDF`);
    } catch (error) {
      console.error("Error printing banknote:", error);
      setMessageTop("Error printing banknote. Please try again.");
    }
  };

  const handleRedeemBanknote = async (
    banknoteId: number,
    amount: string,
    privateKey: string
  ) => {
    try {
      const wallet = new ethers.Wallet(privateKey);
      const messageHash = ethers.keccak256(ethers.toUtf8Bytes(address));
      const messageHashBytes = ethers.getBytes(messageHash);
      const signature = await wallet.signMessage(messageHashBytes);

      const {
        txHash,
        amount: redeemedAmount,
        tokenSymbol,
      } = await redeemBanknote(banknoteId, amount, signature, "0");
      console.log(
        `Banknote redeemed. Amount: ${redeemedAmount} ${tokenSymbol}, Transaction: ${txHash}`
      );
      setScreen(screenMainMenu);
      setMessageTop(`Redeemed ${redeemedAmount} ${tokenSymbol}`);
      await getTokenBalances(); // Refresh token balances
    } catch (error) {
      console.error("Error redeeming banknote:", error);
      setMessageTop("Error redeeming banknote. Please try again.");
    }
  };

  const handleSkimSurplus = async () => {
    try {
      const { txHash, amount } = await skimSurplus(
        tokenAddresses.USDC,
        ethers.parseUnits("0", 6).toString()
      );
      console.log(
        `Surplus skimmed. Amount: ${amount} USDC, Transaction: ${txHash}`
      );
      setScreen(screenMainMenu);
      setMessageTop(`Skimmed ${amount} USDC`);
      await getTokenBalances(); // Refresh token balances
    } catch (error) {
      console.error("Error skimming surplus:", error);
      setMessageTop("Error skimming surplus. Please try again.");
    }
  };

  const handleButtonClick = async (action: number) => {
    console.log("** " + action + " **");

    switch (action) {
      case ActionEnum.PROCESS_LOGIN:
        await login();
        break;
      case ActionEnum.PROCESS_LOGOUT:
        await logout();
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
        setMessageTop(`Printing a note for ${withdrawAmount} NZDT`);
        break;
      case ActionEnum.MINT_USDC:
        await handleMintBanknote(amount, "USDC");
        break;
      case ActionEnum.MINT_EURC:
        await handleMintBanknote(amount, "EURC");
        break;
      case ActionEnum.EXECUTE_WITHDRAW:
        console.log("Withdraw : " + amount);
        // Here you would integrate with the smart contract to mint the banknote
        // For now, we'll just simulate printing
        await handleMintBanknote(amount, "USDC");
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
        if (screen === screenBanknotes && selectedBanknote) {
          await handlePrintBanknote(selectedBanknote.id);
        }
        break;
      // case ActionEnum.SKIM_SURPLUS:
      //   await handleSkimSurplus();
      //   break;
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

  const screenSelectToken: Screen = {
    title: "Select Token",
    options: [
      {
        left: { message: "USDC", actionId: ActionEnum.MINT_USDC },
        right: { message: "EURC", actionId: ActionEnum.MINT_EURC },
      },
      {
        left: { message: "Back", actionId: ActionEnum.GO_WITHDRAW_MENU },
        right: { message: "", actionId: ActionEnum.NONE },
      },
    ],
  };

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
                {address && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "-26px",
                    }}
                  >
                    <AddressDisplay address={address} />
                    <Copy
                      size={32}
                      onClick={copyAddressToClipboard}
                      style={{ marginLeft: "5px", cursor: "pointer" }}
                    />
                  </div>
                )}
                {balance && (
                  <p
                    style={{
                      textAlign: "center",
                      fontSize: "32px",
                      marginBottom: "-20px",
                    }}
                  >
                    {balance} ETH
                  </p>
                )}
                {usdcBalance && (
                  <p style={{ textAlign: "center", fontSize: "24px" }}>
                    USDC Balance: {usdcBalance}
                  </p>
                )}
                {eurcBalance && (
                  <p style={{ textAlign: "center", fontSize: "24px" }}>
                    EURC Balance: {eurcBalance}
                  </p>
                )}
                <h2
                  style={{
                    textAlign: "center",
                    marginBottom: "10px",
                    fontSize: "42px",
                  }}
                >
                  {screen.title}
                  {!loggedIn && <AnimatedRetroLogo />}
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
                      onClick={() => handleButtonClick(ActionEnum.MINT_USDC)}
                    >
                      USDC
                    </button>
                    <button
                      onClick={() => handleButtonClick(ActionEnum.MINT_EURC)}
                    >
                      EURC
                    </button>
                  </div>
                )}

                {screen === screenBanknotes && selectedBanknote && (
                  <div>
                    <h3>Banknote Details</h3>
                    <p>ID: {selectedBanknote.id}</p>
                    <p>
                      Denomination: {selectedBanknote.denomination}{" "}
                      {selectedBanknote.tokenSymbol}
                    </p>
                  </div>
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
