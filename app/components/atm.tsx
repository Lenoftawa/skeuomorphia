"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { screenDisconnected, screenMainMenu, screenWithdrawMenu, screenCurrencyMenu, screenBankMenu } from '../data/menus';
import { Screen } from '../data/interfaces';
import { ActionEnum } from '../data/action-enums';

import AddressDisplay from './AddressDisplay';

import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { Web3AuthNoModal } from "@web3auth/no-modal";
import { Web3Auth } from "@web3auth/modal";
import { IProvider, CHAIN_NAMESPACES, WEB3AUTH_NETWORK, WALLET_ADAPTERS } from "@web3auth/base";
import RPC from '../data/viemRPC';

const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID || "";

const chainConfig = {
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    chainId: "0xaa36a7",
    rpcTarget: "https://rpc.ankr.com/eth_sepolia",
    // Avoid using public rpcTarget in production.
    // Use services like Infura, Quicknode etc
    displayName: "Ethereum Sepolia Testnet",
    blockExplorerUrl: "https://sepolia.etherscan.io",
    ticker: "ETH",
    tickerName: "Ethereum",
    logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
  };

const privateKeyProvider = new EthereumPrivateKeyProvider({ config: { chainConfig } });

const web3auth = new Web3Auth({
    clientId,
    web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
    privateKeyProvider,
  });

export default function ATMComponent() {

    const [screen, setScreen] = useState<Screen>(screenDisconnected);
    const [messageTop, setMessageTop] = useState<string>("");
    const [messageBottom, setMessageBottom] = useState<string>("");
    const [amount, setAmount] = useState<number>(0);

    const [provider, setProvider] = useState<IProvider | null>(null);
    const [loggedIn, setLoggedIn] = useState(false);

    const [address, setAddress] = useState<string>("");
    const [balance, setBalance] = useState<string>("");

    useEffect(() => {
        const init = async () => {
          try {
            await web3auth.initModal();
            setProvider(web3auth.provider);
    
            if (web3auth.connected) {
              setLoggedIn(true);
            }
          } catch (error) {
            console.error(error);
          }
        };
    
        init();
      }, []);

    const login = async () => {
    const web3authProvider = await web3auth.connect();
    setProvider(web3authProvider);
        if (web3auth.connected) {
            setLoggedIn(true);
            getUserInfo();
            getAccounts();
            getBalance();
            setScreen(screenMainMenu);
        }
    };

    const logout = async () => {
        await web3auth.logout();
        setProvider(null);
        setLoggedIn(false);
        console.log("logged out");
    };      

    const getUserInfo = async () => {
        const user = await web3auth.getUserInfo();
        console.log(user);
    };

    const getAccounts = async () => {
        if (!provider) {
            console.log("provider not initialized yet");
            return;
        }
        const address = await RPC.getAccounts(provider);
        console.log(address);
        setAddress(address);
    };

    const getBalance = async () => {
        if (!provider) {
            console.log("provider not initialized yet");
            return;
        }
        const balance = await RPC.getBalance(provider);
        console.log(balance);
        setBalance(balance);
    };    

    const handleButtonClick = (action: number) => {
        
        console.log("** " + action + " **");

        if (action === ActionEnum.PROCESS_LOGIN) {
            // login logic
            login();
        }

        if (action === ActionEnum.PROCESS_LOGOUT) {
            logout();
            setScreen(screenDisconnected);
            setMessageTop("");
            setMessageBottom("");
        }
        if (action === ActionEnum.GO_WITHDRAW_MENU) {
            setScreen(screenWithdrawMenu);
            setAmount(0); // Reset amount using setAmount
            setMessageTop(`$ ${0}`);
        }

        if (action === ActionEnum.GO_CURRENCY_MENU) {
            setScreen(screenCurrencyMenu);
            setMessageTop("");
            setMessageBottom("");
        }

        if (action === ActionEnum.GO_BANK_MENU) {
            setScreen(screenBankMenu);
            setMessageTop("");
            setMessageBottom("");
        }

        if (action === ActionEnum.GO_MAIN_MENU) {
            setScreen(screenMainMenu);
            setMessageTop("");
            setMessageBottom("");
        }

        // Withdraw
        if (action === ActionEnum.PROCESS_WITHDRAW_1) {
            setAmount(prevAmount => prevAmount + 1);
            setMessageTop(`$ ${amount + 1}`);
        }
        if (action === ActionEnum.PROCESS_WITHDRAW_10) {
            setAmount(prevAmount => prevAmount + 10);
            setMessageTop(`$ ${amount + 10}`);
        }
        if (action === ActionEnum.PROCESS_WITHDRAW_50) {
            setAmount(prevAmount => prevAmount + 50);
            setMessageTop(`$ ${amount + 50}`);
        }
        if (action === ActionEnum.PROCESS_WITHDRAW_5) {
            setAmount(prevAmount => prevAmount + 5);
            setMessageTop(`$ ${amount + 5}`);
        }
        if (action === ActionEnum.PROCESS_WITHDRAW_20) {
            setAmount(prevAmount => prevAmount + 20);
            setMessageTop(`$ ${amount + 20}`);
        }
        if (action === ActionEnum.PROCESS_WITHDRAW_100) {
            setAmount(prevAmount => prevAmount + 100);
            setMessageTop(`$ ${amount + 100}`);
        }
        if (action === ActionEnum.EXECUTE_WITHDRAW) {
            // Process Withdraw
            console.log("Withdraw : " + amount);
        }
        if (action === ActionEnum.CANCEL_WITHDRAW) {
            // Exit
            setScreen(screenMainMenu);
            setAmount(0); // Reset amount using setAmount
            setMessageTop("");
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md bg-yellow-100 border-8 border-yellow-700 rounded-lg shadow-lg overflow-hidden">
                <div className="flex">

                    <div className="w-1/4 space-y-4 p-4">
                        <div style={{ height: '100px' }}></div>
                        {screen.options.map((item, index) => (
                            <Button
                                key={`left-${index}`}
                                variant="outline"
                                className="w-full h-12 bg-gray-200 border-2 border-gray-400"
                                onClick={() => handleButtonClick(item.left.actionId)}
                            />
                        ))}
                    </div>
                    <div className="w-1/2 p-4 bg-blue-500 text-white flex flex-col min-w-[216px]">
                        <div className="text-center mb-4 font-bold" style={{ height: '100px' }}>
                            { address && <AddressDisplay address={address} />}
                            { balance && <p>{balance} ETH</p> }
                            {screen.title}
                            { messageTop && <p>{messageTop}</p> }
                        </div>
                        <div className="flex-grow flex flex-col justify-between text-sm">
                            {screen.options.map((item, index) => (
                                <div className="flex justify-between pt-2" key={`option-${index}`}>
                                    <div key={`left-option-${index}`} className="text-left pr-2" style={{ maxWidth: '50%' }}>{item.left.message}</div>
                                    <div key={`right-option-${index}`} className="text-right pl-2" style={{ maxWidth: '50%' }}>{item.right.message}</div>
                                </div>
                            ))}

                        </div>
                    </div>
                    <div className="w-1/4 space-y-4 p-4">
                        <div style={{ height: '100px' }}></div>
                        {screen.options.map((item, index) => (
                            <Button
                                key={`right-${index}`}
                                variant="outline"
                                className="w-full h-12 bg-gray-200 border-2 border-gray-400"
                                onClick={() => handleButtonClick(item.right.actionId)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}