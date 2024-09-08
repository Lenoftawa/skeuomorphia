import { CHAIN_NAMESPACES, Web3AuthOptions } from "@web3auth/modal";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0xaa36a7", // Sepolia chain ID
  rpcTarget: "https://rpc.sepolia.org",
  displayName: "Sepolia Testnet",
  blockExplorer: "https://sepolia.etherscan.io",
  ticker: "ETH",
  tickerName: "Ethereum",
};

const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: { chainConfig },
});

export const web3AuthOptions: Web3AuthOptions = {
  clientId: process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID || "",
  web3AuthNetwork: "sapphire_devnet",
  chainConfig,
  privateKeyProvider,
  uiConfig: {
    theme: "dark",
    loginMethodsOrder: ["google", "facebook", "twitter", "email_passwordless"],
    appLogo: "https://your-app-logo-url.com/logo.png", // Add your app logo URL here
    modalZIndex: "2147483647",
    primaryButton: "socialLogin",
  },
  enableLogging: false,
  useDeviceBasedSeparateChain: true,
};