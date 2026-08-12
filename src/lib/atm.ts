import { ethers } from "ethers";
import QRCode from "qrcode";
export function generateSecret(): { secret: string; secretHash: string } {
  const secret = ethers.hexlify(ethers.randomBytes(32));
  const secretHash = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(["bytes32"], [secret])
  );
  return { secret, secretHash };
}

export function computeCommitHash(
  secret: string,
  merchantAddress: string,
  noteId: number,
  amount: bigint
): string {
  return ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ["bytes32", "address", "uint256", "uint256"],
      [secret, merchantAddress, noteId, amount]
    )
  );
}

export async function generateBanknoteQR(
  noteId: number,
  secret: string,
  denomination: number,
  asset: string,
  symbol: string,
  decimals: number
): Promise<string> {
  const payload = JSON.stringify({
    version: 2,
    noteId,
    secret,
    denomination,
    asset,
    symbol,
    decimals,
    network: "coston2",
  });
  const dataUrl = await QRCode.toDataURL(payload, {
    width: 400,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });
  return dataUrl;
}

export function formatTokenAmount(amount: number): string {
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function shortenAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function parseTokenAmount(amount: number, decimals: number = 6): bigint {
  return ethers.parseUnits(amount.toString(), decimals);
}

export function formatTokenFromWei(wei: bigint, decimals: number = 6): number {
  return Number(ethers.formatUnits(wei, decimals));
}
