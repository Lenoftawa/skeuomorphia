import { sepolia } from "viem/chains";
import { Web3Auth } from "@web3auth/modal";
import {
  createWalletClient,
  createPublicClient,
  custom,
  formatUnits,
  parseUnits,
  encodeFunctionData,
  keccak256,
  toBytes,
  Address,
  Log,
  decodeEventLog,
  ContractFunctionExecutionError,
} from "viem";
import { CHAIN_NAMESPACES, IProvider } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";

// Replace with your contract ABI
const CONTRACT_ABI = [
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
];

const CONTRACT_ADDRESS = process.env
  .NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`;
const EURC_ADDRESS = process.env.NEXT_PUBLIC_EURC_ADDRESS as `0x${string}`;
const NZDT_ADDRESS = process.env.NEXT_PUBLIC_NZDT_ADDRESS as `0x${string}`;

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

export const web3auth = new Web3Auth({
  clientId: process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID || "",
  web3AuthNetwork: "testnet",
  chainConfig,
  privateKeyProvider,
});

async function getClients(provider: IProvider) {
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: custom(provider),
  });

  const walletClient = createWalletClient({
    chain: sepolia,
    transport: custom(provider),
  });

  return { publicClient, walletClient };
}

async function checkContractState(
  publicClient: any,
  userAddress: Address,
  erc20Address: Address,
  denomination: number
) {
  try {
    const balance = await publicClient.readContract({
      address: erc20Address,
      abi: [
        {
          inputs: [{ name: "account", type: "address" }],
          name: "balanceOf",
          outputs: [{ name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function",
        },
      ],
      functionName: "balanceOf",
      args: [userAddress],
    });

    const allowance = await publicClient.readContract({
      address: erc20Address,
      abi: [
        {
          inputs: [
            { name: "owner", type: "address" },
            { name: "spender", type: "address" },
          ],
          name: "allowance",
          outputs: [{ name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function",
        },
      ],
      functionName: "allowance",
      args: [userAddress, CONTRACT_ADDRESS],
    });

    console.log(`User balance: ${balance}, Allowance: ${allowance}, Required: ${denomination}`);

    if (balance < BigInt(denomination) || allowance < BigInt(denomination)) {
      throw new Error("Insufficient balance or allowance for minting");
    }
  } catch (error) {
    console.error("Error checking contract state:", error);
    throw error;
  }
}

export async function mintBanknote(
  provider: IProvider,
  erc20Address: Address,
  denomination: number
): Promise<{ txHash: string; id: number; requestId: string }> {
  const { publicClient, walletClient } = await getClients(provider);
  const [address] = await walletClient.getAddresses();

  try {
    // Check contract state before minting
    await checkContractState(publicClient, address, erc20Address, denomination);

    // Approve token spending
    const approvalTx = await approveTokenSpending(
      provider,
      erc20Address,
      denomination.toString()
    );
    console.log(`Token spending approved. Transaction: ${approvalTx}`);

    // Mint banknote
    console.log(`Attempting to mint banknote: erc20=${erc20Address}, address=${address}, denomination=${denomination}`);
    const { request } = await publicClient.simulateContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "mintBanknote",
      account: address,
      args: [erc20Address, address, denomination],
    });

    const txHash = await walletClient.writeContract(request);
    console.log(`Minting transaction submitted: ${txHash}`);

    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
    });
    console.log(`Minting transaction receipt:`, receipt);

    const mintEvent = receipt.logs.find(
      (log) =>
        log.topics[0] ===
        keccak256(toBytes("banknoteMinted(address,address,uint32,uint8)"))
    ) as Log<bigint, number, false> | undefined;

    const id = mintEvent && mintEvent.topics[3] ? parseInt(mintEvent.topics[3], 16) : 0;

    const randomnessRequestedEvent = receipt.logs.find(
      (log) =>
        log.topics[0] ===
        keccak256(toBytes("RandomnessRequested(uint256)"))
    ) as Log<bigint, number, false> | undefined;

    const requestId = randomnessRequestedEvent?.data ?? "0";

    return { txHash, id, requestId };
  } catch (error) {
    console.error("Detailed error in mintBanknote:", error);
    if (error instanceof ContractFunctionExecutionError) {
      console.error("Contract execution error details:", {
        errorName: error.name,
        errorMessage: error.message,
        errorCause: error.cause,
        errorData: error.data,
      });
      throw new Error(`Contract error: ${error.shortMessage || error.message}`);
    } else if (error instanceof Error) {
      throw new Error(`Minting error: ${error.message}`);
    } else {
      throw new Error(`Unexpected error during minting: ${String(error)}`);
    }
  }
}

export async function redeemBanknote(
  provider: IProvider,
  banknoteId: number,
  amount: bigint,
  signature: `0x${string}`,
  description: string
): Promise<{ txHash: string; amount: string; tokenSymbol: string }> {
  const { publicClient, walletClient } = await getClients(provider);
  const [address] = await walletClient.getAddresses();

  const { request } = await publicClient.simulateContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "redeemBanknote",
    account: address,
    args: [banknoteId, amount, signature, description],
  });

  const txHash = await walletClient.writeContract(request);
  const receipt = await publicClient.waitForTransactionReceipt({
    hash: txHash,
  });

  const redeemedEvent = receipt.logs.find(
    (log) =>
      log.topics[0] ===
      keccak256(
        toBytes("banknoteRedeemed(address,address,uint256,bytes32,uint32)")
      )
  ) as Log<bigint, number, false> | undefined;

  if (redeemedEvent && redeemedEvent.data) {
    const eventAbi = CONTRACT_ABI.find(
      (item) => item.name === "banknoteRedeemed"
    );
    if (!eventAbi || eventAbi.type !== "event") {
      throw new Error("banknoteRedeemed event not found in ABI");
    }

    const decodedData = decodeEventLog({
      abi: [eventAbi],
      data: redeemedEvent.data,
      topics: redeemedEvent.topics,
    });

    const erc20 = decodedData.args.erc20 as Address;
    const amountBN = decodedData.args.amount as bigint;
    const tokenSymbol = await getTokenSymbol(provider, erc20);

    return {
      txHash,
      amount: formatUnits(amountBN, await getTokenDecimals(provider, erc20)),
      tokenSymbol,
    };
  }

  throw new Error("Redemption event not found");
}

export async function getBanknoteInfo(
  provider: IProvider,
  banknoteId: number
): Promise<{
  minter: Address;
  pubkey: Address;
  erc20: Address;
  denomination: number;
  uniqueIdentifier: string;
}> {
  const { publicClient } = await getClients(provider);

  const result = (await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getBanknoteInfo",
    args: [banknoteId],
  })) as [Address, Address, Address, number, bigint];

  return {
    minter: result[0],
    pubkey: result[1],
    erc20: result[2],
    denomination: result[3],
    uniqueIdentifier: result[4].toString(),
  };
}

async function getTokenDecimals(
  provider: IProvider,
  tokenAddress: Address
): Promise<number> {
  const { publicClient } = await getClients(provider);

  const decimals = await publicClient.readContract({
    address: tokenAddress,
    abi: [
      {
        inputs: [],
        name: "decimals",
        outputs: [{ name: "", type: "uint8" }],
        stateMutability: "view",
        type: "function",
      },
    ],
    functionName: "decimals",
  });

  return Number(decimals);
}

export async function getTokenSymbol(
  provider: IProvider,
  tokenAddress: Address
): Promise<string> {
  const { publicClient } = await getClients(provider);

  const symbol = await publicClient.readContract({
    address: tokenAddress,
    abi: [
      {
        inputs: [],
        name: "symbol",
        outputs: [{ name: "", type: "string" }],
        stateMutability: "view",
        type: "function",
      },
    ],
    functionName: "symbol",
  });

  return symbol as string;
}

export async function getTokenBalance(
  provider: IProvider,
  userAddress: Address,
  tokenAddress: Address
): Promise<string> {
  const { publicClient } = await getClients(provider);

  if (tokenAddress === userAddress) {
    // For ETH
    const balance = await publicClient.getBalance({ address: userAddress });
    return formatUnits(balance, 18);
  } else {
    // For ERC20 tokens
    try {
      const balance = await publicClient.readContract({
        address: tokenAddress,
        abi: [
          {
            inputs: [{ name: "account", type: "address" }],
            name: "balanceOf",
            outputs: [{ name: "", type: "uint256" }],
            stateMutability: "view",
            type: "function",
          },
        ],
        functionName: "balanceOf",
        args: [userAddress],
      });

      const decimals = await getTokenDecimals(provider, tokenAddress);
      return formatUnits(balance as bigint, decimals);
    } catch (error) {
      console.error(`Error fetching balance for token ${tokenAddress}:`, error);
      return "0";
    }
  }
}

export async function getAllTokenBalances(
  provider: IProvider,
  userAddress: Address
): Promise<{
  ETH: string;
  USDC: string;
  EURC: string;
  NZDT: string;
}> {
  const tokenAddresses = await getTokenAddresses();

  const [ethBalance, usdcBalance, eurcBalance, nzdtBalance] = await Promise.all(
    [
      getTokenBalance(provider, userAddress, userAddress), // ETH balance
      getTokenBalance(provider, userAddress, tokenAddresses.USDC),
      getTokenBalance(provider, userAddress, tokenAddresses.EURC),
      getTokenBalance(provider, userAddress, tokenAddresses.NZDT),
    ]
  );

  return {
    ETH: ethBalance,
    USDC: usdcBalance,
    EURC: eurcBalance,
    NZDT: nzdtBalance,
  };
}

export async function getTokenAddresses(): Promise<{
  USDC: Address;
  EURC: Address;
  NZDT: Address;
  ETH: Address;
}> {
  return {
    USDC: USDC_ADDRESS,
    EURC: EURC_ADDRESS,
    NZDT: NZDT_ADDRESS,
    ETH: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" as Address,
  };
}

export async function approveTokenSpending(
  provider: IProvider,
  tokenAddress: Address,
  amount: string
): Promise<string> {
  const { publicClient, walletClient } = await getClients(provider);
  const [address] = await walletClient.getAddresses();

  try {
    const decimals = await getTokenDecimals(provider, tokenAddress);
    const parsedAmount = parseUnits(amount, decimals);

    const { request } = await publicClient.simulateContract({
      address: tokenAddress,
      abi: [
        {
          inputs: [
            { name: "spender", type: "address" },
            { name: "amount", type: "uint256" },
          ],
          name: "approve",
          outputs: [{ name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function",
        },
      ],
      functionName: "approve",
      account: address,
      args: [CONTRACT_ADDRESS, parsedAmount],
    });

    const txHash = await walletClient.writeContract(request);
    await publicClient.waitForTransactionReceipt({ hash: txHash });

    return txHash;
  } catch (error) {
    console.error("Error in approveTokenSpending:", error);
    throw error;
  }
}
