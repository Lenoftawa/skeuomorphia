import { ethers } from 'ethers';
import { Web3Auth } from "@web3auth/modal";
import { CHAIN_NAMESPACES, IProvider } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";

// Replace with your contract ABI
const CONTRACT_ABI = [
  {
    "name": "BanknoteCollateralVault",
    "address": "0xbf26b234f3e48b32cfdad055b31a99c19cb45557",
    "abi": [
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "target",
            "type": "address"
          }
        ],
        "name": "AddressEmptyCode",
        "type": "error"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "account",
            "type": "address"
          }
        ],
        "name": "AddressInsufficientBalance",
        "type": "error"
      },
      {
        "inputs": [],
        "name": "FailedInnerCall",
        "type": "error"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "token",
            "type": "address"
          }
        ],
        "name": "SafeERC20FailedOperation",
        "type": "error"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "_sender",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "address",
            "name": "_erc20",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "_amount",
            "type": "uint256"
          }
        ],
        "name": "Deposited",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "minter",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "address",
            "name": "erc20",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint32",
            "name": "id",
            "type": "uint32"
          },
          {
            "indexed": false,
            "internalType": "uint8",
            "name": "denomination",
            "type": "uint8"
          }
        ],
        "name": "banknoteMinted",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "redeemer",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "address",
            "name": "erc20",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "bytes32",
            "name": "description",
            "type": "bytes32"
          },
          {
            "indexed": false,
            "internalType": "uint32",
            "name": "id",
            "type": "uint32"
          }
        ],
        "name": "banknoteRedeemed",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "_sender",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "address",
            "name": "_erc20",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "_amount",
            "type": "uint256"
          }
        ],
        "name": "surplusFundsSkimmed",
        "type": "event"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "_erc20",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "_amount",
            "type": "uint256"
          }
        ],
        "name": "DepositFrom",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "_erc20",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "_pubkey",
            "type": "address"
          },
          {
            "internalType": "uint8",
            "name": "_denomination",
            "type": "uint8"
          }
        ],
        "name": "mintBanknote",
        "outputs": [
          {
            "internalType": "uint32",
            "name": "id",
            "type": "uint32"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint32",
            "name": "_banknote",
            "type": "uint32"
          },
          {
            "internalType": "uint256",
            "name": "_amount",
            "type": "uint256"
          },
          {
            "internalType": "bytes",
            "name": "_sig",
            "type": "bytes"
          },
          {
            "internalType": "bytes32",
            "name": "_description",
            "type": "bytes32"
          }
        ],
        "name": "redeemBanknote",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "_erc20",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "_amount",
            "type": "uint256"
          }
        ],
        "name": "skimSurplus",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "_owner",
            "type": "address"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "stateMutability": "payable",
        "type": "receive"
      },
      {
        "inputs": [
          {
            "internalType": "uint32",
            "name": "_id",
            "type": "uint32"
          }
        ],
        "name": "getBanknoteInfo",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          },
          {
            "internalType": "uint8",
            "name": "",
            "type": "uint8"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "getNextId",
        "outputs": [
          {
            "internalType": "uint32",
            "name": "",
            "type": "uint32"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "_owner",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "_erc20",
            "type": "address"
          }
        ],
        "name": "getSurplus",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "bytes",
            "name": "signature",
            "type": "bytes"
          }
        ],
        "name": "splitSignature",
        "outputs": [
          {
            "internalType": "bytes32",
            "name": "r",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32",
            "name": "s",
            "type": "bytes32"
          },
          {
            "internalType": "uint8",
            "name": "v",
            "type": "uint8"
          }
        ],
        "stateMutability": "pure",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "string",
            "name": "str",
            "type": "string"
          }
        ],
        "name": "stringToAddress",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "pure",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "_addr",
            "type": "address"
          },
          {
            "internalType": "bytes",
            "name": "_signature",
            "type": "bytes"
          }
        ],
        "name": "verifySignatureOfAddress",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "pure",
        "type": "function"
      }
    ],
    "filePath": "default_workspace/contracts/banknoteCollateralVault.sol",
    "pinnedAt": 1725617324084
  }  
];

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS || '';
const EURC_ADDRESS = process.env.NEXT_PUBLIC_EURC_ADDRESS || '';

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0xaa36a7", // Sepolia chain ID
  rpcTarget: "https://rpc.sepolia.org", // Sepolia RPC URL
  displayName: "Sepolia Testnet",
  blockExplorer: "https://sepolia.etherscan.io",
  ticker: "ETH",
  tickerName: "Ethereum",
};

const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: { chainConfig }
});

const web3auth = new Web3Auth({
  clientId: process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID || '',
  web3AuthNetwork: "testnet",
  chainConfig,
  privateKeyProvider
});

async function getProvider(): Promise<ethers.BrowserProvider> {
  await web3auth.initModal();
  const web3authProvider = await web3auth.connect();
  return new ethers.BrowserProvider(web3authProvider as IProvider);
}

async function getContract(provider: ethers.BrowserProvider): Promise<ethers.Contract> {
  const signer = await provider.getSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
}

export async function mintBanknote(erc20Address: string, pubkey: string, denomination: number): Promise<{ txHash: string; id: number }> {
  const provider = await getProvider();
  const contract = await getContract(provider);
  const tx = await contract.mintBanknote(erc20Address, pubkey, denomination);
  const receipt = await tx.wait();
  const event = receipt.logs.find(log => log.eventName === 'banknoteMinted');
  const id = event?.args?.id;
  return { txHash: tx.hash, id };
}

export async function redeemBanknote(banknoteId: number, amount: string, signature: string, discount: string): Promise<{ txHash: string; amount: string; tokenSymbol: string }> {
  const provider = await getProvider();
  const contract = await getContract(provider);
  const tx = await contract.redeemBanknote(banknoteId, amount, signature, discount);
  const receipt = await tx.wait();
  const event = receipt.logs.find(log => log.eventName === 'banknoteRedeemed');
  const redeemedAmount = event?.args?.amount;
  const erc20Address = event?.args?.erc20;

  const tokenContract = new ethers.Contract(erc20Address, ['function symbol() view returns (string)'], provider);
  const tokenSymbol = await tokenContract.symbol();

  return { 
    txHash: tx.hash, 
    amount: ethers.formatUnits(redeemedAmount, 6), // Using 6 decimals for USDC
    tokenSymbol 
  };
}

export async function skimSurplus(erc20Address: string, amount: string): Promise<{ txHash: string; amount: string }> {
  const provider = await getProvider();
  const contract = await getContract(provider);
  const tx = await contract.skimSurplus(erc20Address, amount);
  const receipt = await tx.wait();
  const event = receipt.logs.find(log => log.eventName === 'surplusFundsSkimmed');
  const skimmedAmount = event?.args?._amount;

  return {
    txHash: tx.hash,
    amount: ethers.formatUnits(skimmedAmount, 6) // Using 6 decimals for USDC
  };
}

export async function getBanknoteInfo(banknoteId: number): Promise<{ minter: string; pubkey: string; erc20: string; denomination: number }> {
  const provider = await getProvider();
  const contract = await getContract(provider);
  const [minter, pubkey, erc20, denomination] = await contract.getBanknoteInfo(banknoteId);
  return { minter, pubkey, erc20, denomination };
}

export async function getSurplus(owner: string, erc20Address: string): Promise<string> {
  const provider = await getProvider();
  const contract = await getContract(provider);
  const surplus = await contract.getSurplus(owner, erc20Address);
  return ethers.formatUnits(surplus, 6); // Using 6 decimals for USDC
}

export async function getNextId(): Promise<number> {
  const provider = await getProvider();
  const contract = await getContract(provider);
  return await contract.getNextId();
}

export async function fetchTokenAddresses(): Promise<{ USDC: string; EURC: string }> {
  return { USDC: USDC_ADDRESS, EURC: EURC_ADDRESS };
}

export async function getTokenBalance(address: string, tokenAddress: string): Promise<string> {
  const provider = await getProvider();
  const tokenContract = new ethers.Contract(tokenAddress, ['function balanceOf(address) view returns (uint256)', 'function symbol() view returns (string)'], provider);
  const balance = await tokenContract.balanceOf(address);
  const symbol = await tokenContract.symbol();
  return `${ethers.formatUnits(balance, 6)} ${symbol}`; // Using 6 decimals for USDC
}

export async function getTokenAddresses(): Promise<{ USDC: string; EURC: string }> {
  return { USDC: USDC_ADDRESS, EURC: EURC_ADDRESS };
}

export async function approveTokenSpending(tokenAddress: string, amount: string): Promise<string> {
  const provider = await getProvider();
  const signer = await provider.getSigner();
  const tokenContract = new ethers.Contract(tokenAddress, ['function approve(address spender, uint256 amount) returns (bool)'], signer);
  const tx = await tokenContract.approve(CONTRACT_ADDRESS, amount);
  await tx.wait();
  return tx.hash;
}