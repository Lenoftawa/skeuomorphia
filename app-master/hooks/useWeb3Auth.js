import { useState, useEffect, useCallback } from 'react';
import { Web3Auth } from "@web3auth/modal";
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import RPC from '../data/viemRPC';

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

const privateKeyProvider = new EthereumPrivateKeyProvider({ config: { chainConfig } });

const web3auth = new Web3Auth({
  clientId,
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
  privateKeyProvider,
});

export const useWeb3Auth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState("");

  useEffect(() => {
    const init = async () => {
      await web3auth.initModal();
      if (web3auth.connected) {
        setIsLoggedIn(true);
        await updateUserInfo();
      }
    };
    init();
  }, []);

  const updateUserInfo = useCallback(async () => {
    if (web3auth.provider) {
      const addr = await RPC.getAccounts(web3auth.provider);
      const bal = await RPC.getBalance(web3auth.provider);
      setAddress(addr);
      setBalance(bal);
    }
  }, []);

  const login = useCallback(async () => {
    await web3auth.connect();
    setIsLoggedIn(true);
    await updateUserInfo();
  }, [updateUserInfo]);

  const logout = useCallback(async () => {
    await web3auth.logout();
    setIsLoggedIn(false);
    setAddress("");
    setBalance("");
  }, []);

  return { isLoggedIn, address, balance, login, logout };
};