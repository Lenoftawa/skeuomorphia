import { ethers } from 'ethers'

// Replace with your contract ABI and address
const CONTRACT_ABI = [/* Your contract ABI here */]
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || ''

export async function redeemToken(privateKey: string): Promise<string> {
  if (typeof window.ethereum !== 'undefined') {
    await window.ethereum.request({ method: 'eth_requestAccounts' })
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signer = provider.getSigner()
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)

    // Sign the message (merchant's address) with the scanned private key
    const merchantAddress = await signer.getAddress()
    const signingKey = new ethers.utils.SigningKey(privateKey)
    const messageHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(merchantAddress))
    const signature = signingKey.signDigest(messageHash)

    // Call the redeem function on the contract
    const tx = await contract.redeemBanknote(signature.v, signature.r, signature.s)
    await tx.wait()

    return tx.hash
  } else {
    throw new Error('Ethereum wallet not detected')
  }
}