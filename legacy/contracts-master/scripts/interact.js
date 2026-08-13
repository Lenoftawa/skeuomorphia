const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Using account:", signer.address);

  const addresses = JSON.parse(fs.readFileSync("deployed-addresses.json"));
  const vaultAddress = addresses.vault;
  console.log("Using vault contract at:", vaultAddress);

  const BanknoteCollateralVault = await ethers.getContractFactory("BanknoteCollateralVault");
  const vault = BanknoteCollateralVault.attach(vaultAddress);

  const tokenAddress = addresses.usdc;
  const tokenName = "USDC";
  const tokenDecimals = 6;

  // Use getContractAt for USDC
  const token = await ethers.getContractAt("IERC20", tokenAddress);

  // Check token balance of the vault contract
  const vaultBalance = await token.balanceOf(vaultAddress);
  console.log(`Vault ${tokenName} balance: ${ethers.utils.formatUnits(vaultBalance, tokenDecimals)} ${tokenName}`);

  // Define denomination (1 USDC)
  const denominationAmount = 1;
  console.log(`Denomination: ${denominationAmount} ${tokenName}`);

  try {
    // Create a new wallet for the banknote
    const banknoteWallet = ethers.Wallet.createRandom();
    console.log("Minting banknote...");
    console.log("Banknote Public Address:", banknoteWallet.address);

    // Mint banknote
    const mintTx = await vault.mintBanknote(
      tokenAddress,
      banknoteWallet.address,
      denominationAmount,
      { gasLimit: 300000 }
    );

    console.log("Transaction sent:", mintTx.hash);
    const mintReceipt = await mintTx.wait();
    console.log("Transaction mined:", mintReceipt.transactionHash);
    console.log("Transaction status:", mintReceipt.status);

    if (mintReceipt.status === 1) {
      const banknoteEvent = mintReceipt.events.find(e => e.event === 'banknoteMinted');
      if (banknoteEvent) {
        const banknoteId = banknoteEvent.args.id;
        console.log(`Minted banknote with ID ${banknoteId}, denomination ${denominationAmount} ${tokenName}`);
        console.log(`Banknote Private Key: ${banknoteWallet.privateKey}`);
        console.log(`Banknote Public Address: ${banknoteWallet.address}`);

        // Get banknote info
        const banknoteInfo = await vault.getBanknoteInfo(banknoteId);
        console.log("Banknote info:", banknoteInfo);

        // Save banknote info to a file for easy access
        const banknoteData = {
          id: banknoteId.toString(),
          privateKey: banknoteWallet.privateKey,
          publicAddress: banknoteWallet.address,
          denomination: denominationAmount,
          token: tokenName
        };
        fs.writeFileSync("banknote-info.json", JSON.stringify(banknoteData, null, 2));
        console.log("Banknote information saved to banknote-info.json");
      } else {
        console.log("Transaction successful, but banknoteMinted event not found. Check contract logs for more information.");
      }
    } else {
      console.log("Transaction failed. Check contract logs for more information.");
    }
  } catch (error) {
    console.error("Error minting banknote:", error.message);
    if (error.reason) console.error("Reason:", error.reason);
    if (error.data) console.error("Error data:", error.data);
    if (error.transaction) console.error("Transaction details:", error.transaction);
    if (error.receipt) console.error("Transaction receipt:", error.receipt);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });