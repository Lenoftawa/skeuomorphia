import { ethers } from "ethers";

export const STABLECOIN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function faucet()",
  "function mint(address to, uint256 amount)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
];

export const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
];

export const BEARER_NOTE_ESCROW_ABI = [
  "function nextNoteId() view returns (uint256)",
  "function notes(uint256) view returns (address asset, uint256 faceValue, bytes32 secretHash, address issuer, uint64 createdAt, uint64 expiresAt, bool redeemed, bool fdcAttested)",
  "function mintNote(address asset, uint256 faceValue, bytes32 secretHash, uint64 expiresAt) returns (uint256)",
  "function mintNoteAttested((((string,string,string,string,string,string,string),(bytes32,bytes32,bytes32,(string,string,string,string,string,string,string))),bytes) proof, address asset, uint256 faceValue, bytes32 secretHash, uint64 expiresAt) returns (uint256)",
  "function commitRedemption(uint256 noteId, bytes32 commitment)",
  "function redeemNote(uint256 noteId, bytes32 secret, uint256 amount)",
  "function cancelNote(uint256 noteId, bytes32 secret)",
  "function complianceUrlPrefix() view returns (string)",
  "function complianceMaxAge() view returns (uint256)",
  "function fdcAttestedMintCount() view returns (uint256)",
  "function setComplianceUrlPrefix(string prefix)",
  "function setComplianceMaxAge(uint256 maxAge)",
  "event NoteMinted(uint256 indexed noteId, address indexed asset, address indexed issuer, uint256 faceValue, uint64 expiresAt, bool fdcAttested)",
  "event NoteRedeemed(uint256 indexed noteId, address indexed asset, address indexed merchant, address issuer, uint256 amount, uint256 issuerChange)",
];

export const CASH_ESCROW_ABI = [
  "function stableCoin() view returns (address)",
  "function nextNoteId() view returns (uint256)",
  "function banknotes(uint256) view returns (uint256 denomination, bytes32 secretHash, address owner, bool redeemed, uint256 createdAt)",
  "function mintNote(uint256 denomination, bytes32 secretHash) returns (uint256)",
  "function commitRedemption(uint256 noteId, bytes32 commitHash)",
  "function redeemNote(uint256 noteId, bytes32 secret, uint256 amount)",
  "function cancelNote(uint256 noteId, bytes32 secret)",
  "function getNote(uint256 noteId) view returns (tuple(uint256 denomination, bytes32 secretHash, address owner, bool redeemed, uint256 createdAt))",
  "event NoteMinted(uint256 indexed noteId, address indexed owner, uint256 denomination)",
  "event NoteRedeemed(uint256 indexed noteId, address indexed merchant, address indexed owner, uint256 amount, uint256 change)",
  "event RedemptionCommitted(uint256 indexed noteId, address indexed merchant, bytes32 commitHash)",
  "event NoteCancelled(uint256 indexed noteId, address indexed owner)",
];

export const CONTRACT_REGISTRY_ABI = [
  "function getContractAddressByName(string name) view returns (address)",
  "function getContractAddressByHash(bytes32 nameHash) view returns (address)",
  "function getAllContracts() view returns (string[] names, address[] addresses)",
];

// Flare Data Connector system contracts (resolved via ContractRegistry at runtime).
export const FDC_HUB_ABI = [
  "function requestAttestation(bytes data) payable returns (uint256)",
];
export const FDC_REQUEST_FEE_ABI = [
  "function getRequestFee(bytes data, uint256 responseCount) view returns (uint256)",
];
export const FLARE_SYSTEMS_MANAGER_ABI = [
  "function getVotingRoundStartBlockNumber(uint256 votingRoundId) view returns (uint256)",
  "function getCurrentVotingRoundId() view returns (uint256)",
];
export const RELAY_ABI = [
  "function getLatestVotingRoundId() view returns (uint256)",
  "function merkleRoot(uint256 votingRoundId, bytes32 submissionAccount) view returns (bytes32)",
];
export const FDC_VERIFICATION_ABI = [
  "function verifyWeb2Json((((string,string,string,string,string,string,string),(bytes32,bytes32,bytes32,(string,string,string,string,string,string,string))),bytes) proof) view returns (bool)",
];

export const WNAT_ABI = [
  "function deposit() payable",
  "function withdraw(uint256 amount)",
  "function balanceOf(address) view returns (uint256)",
  "function delegate(address to, uint256 bips)",
  "function batchDelegate(address[] to, uint256[] bips)",
  "function undelegateAll()",
  "function delegatesOf(address who) view returns (address[] delegatees, uint256[] bips, uint256[] amounts, uint256)",
  "function balanceOfAt(address who, uint256 blockNumber) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
];

export const REWARD_MANAGER_ABI = [
  "function getRewardEpochIdsWithClaimableRewards() view returns (uint24 startEpochId, uint24 endEpochId)",
  "function getNextClaimableRewardEpochId(address rewardOwner) view returns (uint256)",
  "function getStateOfRewards(address rewardOwner) view returns (tuple(uint256 rewardEpochId, address[] beneficiaries, uint256[] amounts, bool[] claimed)[])",
  "function claim(address rewardOwner, address payable recipient, uint24 rewardEpochId, bool wrap, tuple(uint256 rewardEpochId, address beneficiary, uint256 amount, uint256 claimType, bytes32[] merkleProof)[] proofs) returns (uint256)",
];

export const FTSO_MANAGER_ABI = [
  "function getDataProviderCount() view returns (uint256)",
  "function getDataProviderAt(uint256 index) view returns (address)",
  "function getDataProviderInfo(address) view returns (string name, string symbol, uint256 votePower, bool active)",
];

export const FTSO_REWARD_MANAGER_ABI = [
  "function getEpochsWithClaimableRewards(address) view returns (uint256[])",
  "function getClaimableRewardAmounts(address, uint256[] epochIds) view returns (uint256[] amounts, bool[] claimed)",
  "function claimReward(address payable recipient, uint256[] epochIds) returns (uint256)",
  "function claimAndWrapReward(address payable recipient, uint256[] epochIds) returns (uint256)",
];

export const CLAIM_SETUP_MANAGER_ABI = [
  "function setClaimingForDelegate(address delegate, address execAddress, uint256 executorFeeBips)",
  "function getClaimingForDelegate(address delegate, address execAddress) view returns (uint256 executorFeeBips)",
  "function setClaimExecutors(address[] executors)",
  "function getClaimExecutors(address delegate) view returns (address[] executors)",
  "function setExpiredExecutors(address[] executors)",
  "function continuousClaim(address delegate, uint256 executorFeeBips, uint256[] rewardEpochIds)",
];

export const SIMPLE_SWAP_ABI = [
  "function createPair(address tokenA, address tokenB)",
  "function addLiquidity(address tokenA, address tokenB, uint256 amountA, uint256 amountB)",
  "function swap(address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut) returns (uint256)",
  "function getQuote(address tokenIn, address tokenOut, uint256 amountIn) view returns (uint256)",
  "function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) pure returns (uint256)",
  "function getReserves(address tokenA, address tokenB) view returns (uint256 reserveA, uint256 reserveB)",
  "function pairCount() view returns (uint256)",
  "function getPairAt(uint256 index) view returns (address tokenA, address tokenB, uint256 reserveA, uint256 reserveB)",
  "function pairId(address tokenA, address tokenB) pure returns (bytes32)",
  "event SwapExecuted(bytes32 indexed pairId, address indexed user, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut)",
];

export const DISTRIBUTION_TO_DELEGATORS_ABI = [
  "function getClaimableAmountOf(address account, uint256 month) view returns (uint256 amount)",
  "function getClaimableMonths() view returns (uint256 startMonth, uint256 endMonth)",
  "function getCurrentMonth() view returns (uint256)",
  "function claim(address rewardOwner, address recipient, uint256 month, bool wrap) returns (uint256)",
  "function totalClaimedWei() view returns (uint256)",
];

export const ASSET_MANAGER_ABI = [
  "function asset() view returns (string)",
  "function symbol() view returns (string)",
  "function getAssetToUbaRatio() view returns (uint256)",
  "function getCollateralRatioBps() view returns (uint256)",
  "function getMintingFeeBps() view returns (uint256)",
  "function getRedemptionFeeBps() view returns (uint256)",
  "function getFAssetBalance(address owner) view returns (uint256)",
  "function redeem(uint256 lots, string underlyingAddress, string underlyingReturnAddress) returns (uint256)",
];

export interface ContractAddresses {
  stableCoin: string;
  cashEscrow: string;
  assetRegistry: string;
  bearerNoteEscrow: string;
  fxrp: string;
  simpleSwap: string;
  contractRegistry: string;
}

export const DEPLOYED_ADDRESSES: ContractAddresses = {
  stableCoin: process.env.NEXT_PUBLIC_STABLECOIN_ADDRESS || "",
  cashEscrow: process.env.NEXT_PUBLIC_CASH_ESCROW_ADDRESS || "",
  assetRegistry: process.env.NEXT_PUBLIC_ASSET_REGISTRY_ADDRESS || "",
  bearerNoteEscrow: process.env.NEXT_PUBLIC_BEARER_NOTE_ESCROW_ADDRESS || "",
  fxrp: process.env.NEXT_PUBLIC_FXRP_ADDRESS || "",
  simpleSwap: process.env.NEXT_PUBLIC_SIMPLE_SWAP_ADDRESS || "",
  contractRegistry: "0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019",
};

export function getStableCoinContract(
  provider: ethers.Provider | ethers.Signer,
  address: string
) {
  return new ethers.Contract(address, STABLECOIN_ABI, provider);
}

export function getERC20Contract(
  provider: ethers.Provider | ethers.Signer,
  address: string
) {
  return new ethers.Contract(address, ERC20_ABI, provider);
}

export function getBearerNoteEscrowContract(
  provider: ethers.Provider | ethers.Signer,
  address: string
) {
  return new ethers.Contract(address, BEARER_NOTE_ESCROW_ABI, provider);
}

export function getCashEscrowContract(
  provider: ethers.Provider | ethers.Signer,
  address: string
) {
  return new ethers.Contract(address, CASH_ESCROW_ABI, provider);
}

export function getSimpleSwapContract(
  provider: ethers.Provider | ethers.Signer,
  address: string
) {
  return new ethers.Contract(address, SIMPLE_SWAP_ABI, provider);
}

export function getWNatContract(
  provider: ethers.Provider | ethers.Signer,
  address: string
) {
  return new ethers.Contract(address, WNAT_ABI, provider);
}

export function getFtsoManagerContract(
  provider: ethers.Provider | ethers.Signer,
  address: string
) {
  return new ethers.Contract(address, FTSO_MANAGER_ABI, provider);
}

export function getFtsoRewardManagerContract(
  provider: ethers.Provider | ethers.Signer,
  address: string
) {
  return new ethers.Contract(address, FTSO_REWARD_MANAGER_ABI, provider);
}

export function getClaimSetupManagerContract(
  provider: ethers.Provider | ethers.Signer,
  address: string
) {
  return new ethers.Contract(address, CLAIM_SETUP_MANAGER_ABI, provider);
}

export async function resolveFlareContract(
  name: string,
  provider: ethers.Provider
): Promise<string> {
  const registry = new ethers.Contract(
    DEPLOYED_ADDRESSES.contractRegistry,
    CONTRACT_REGISTRY_ABI,
    provider
  );
  try {
    return await registry.getContractAddressByName(name);
  } catch {
    return "";
  }
}
