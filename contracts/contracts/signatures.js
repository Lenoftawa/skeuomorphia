
// This is mostly gleaned from ChatGPT although it seems pretty much like what others say
// On the other hand there was a worryingly human bug that has been fixed.
// I could not get ethers to do the right thing but you may have a better change.
// V5 would not do one thing and then v6 was async and would not work with the app structure.
// So good luck.

onst { ethers } = require('ethers');

/**
 * Function to generate a new Ethereum wallet (key pair).
 */
function generateKeyPair() {
    // Generate a random wallet (key pair)
    const wallet = ethers.Wallet.createRandom();

    // Extract private and public keys
    const privateKey = wallet.privateKey;
    const publicKey = wallet.address; // The public key is the wallet address
    
    // ******** Print  privateKey on the banknote as a QR code etc.
    // ******** Put publicKey in the mintBanknote() function
}

/**
 * Function to sign an address with the private key on a banknote.
 */
async function signMessage(privateKey, ownAddress) {
    // Create a wallet instance using the provided private key
    const wallet = new ethers.Wallet(privateKey);

    // Calculate the message hash using the standard Ethereum prefix
    const messageHash = ethers.utils.hashMessage(ownAddress);

    // Sign the message hash deterministically
    const signature = await wallet.signMessage(messageHash);

    // ******** Put the signature into the redeemBanknote() function
}

// Usage
const { privateKey, publicKey } = generateKeyPair();
const message = "hello";
signMessage(privateKey, message);
