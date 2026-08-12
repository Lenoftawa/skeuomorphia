import { useState, useEffect, useCallback } from 'react';
import { web3auth } from '../utils/web3';
import { getTokenBalance } from '../utils/web3';

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
      const addr = await web3auth.provider.request({ method: "eth_accounts" }) as string[];
      setAddress(Array.isArray(addr) ? addr[0] : addr);
      const bal = await getTokenBalance(web3auth.provider, addr[0] as `0x${string}`, addr[0] as `0x${string}`);
      setBalance(bal);
    }
  }, []);

  const login = useCallback(async () => {
    if (!web3auth.connected) {
      await web3auth.connect();
    }
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