// scripts/interact.js
const { ethers } = require("hardhat");
const fs = require('fs');

// Setup logging
const logFile = 'interaction_log.txt';
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp}: ${message}\n`;
  console.log(logMessage);
  fs.appendFileSync(logFile, logMessage);
}

async function main() {
  try {
    const [signer, addr1] = await ethers.getSigners();

    log(`Using signer address: ${signer.address}`);

    // Load contract addresses
    const nzDollarAddress = ""; // Add the deployed NZDollar address here
    const vaultAddress = ""; // Add the deployed BanknoteCollateralVault address here

    if (!nzDollarAddress || !vaultAddress) {
      throw new Error("Contract addresses not set");
    }

    const NZDollar = await ethers.getContractFactory("NZDollar");
    const nzDollar = NZDollar.attach(nzDollarAddress);

    const BanknoteCollateralVault = await ethers.getContractFactory("BanknoteCollateralVault");
    const vault = BanknoteCollateralVault.attach(vaultAddress);

    log("Contracts loaded successfully");

    // Approve vault to spend NZDollar
    const approveAmount = ethers.utils.parseEther("1000");
    const approveTx = await nzDollar.approve(vaultAddress, approveAmount);
    await approveTx.wait();
    log(`Approved vault to spend ${ethers.utils.formatEther(approveAmount)} NZDollar`);

    // Mint a banknote
    const denomination = 100;
    const secret = ethers.utils.randomBytes(32);
    const hashedSecret = ethers.utils.keccak256(secret);
    const mintTx = await vault.mintBanknote(nzDollarAddress, hashedSecret, denomination);
    const mintReceipt = await mintTx.wait();
    const banknoteId = mintReceipt.events.find(e => e.event === 'banknoteMinted').args.id;
    log(`Minted banknote with ID ${banknoteId}, denomination ${denomination}, transaction hash: ${mintReceipt.transactionHash}`);

    // Get banknote info
    const banknoteInfo = await vault.getBanknoteInfo(banknoteId);
    log(`Banknote info: Minter: ${banknoteInfo[0]}, HashedSecret: ${banknoteInfo[1]}, ERC20: ${banknoteInfo[2]}, Denomination: ${banknoteInfo[3]}`);

    // Redeem partial amount of the banknote
    const redeemAmount = ethers.utils.parseEther("50");
    const discount = ethers.utils.parseEther("1");
    const hash2 = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(["bytes32", "address"], [hashedSecret, addr1.address]));
    
    const redeemTx = await vault.connect(addr1).redeemBanknote(banknoteId, redeemAmount, hash2, discount);
    const redeemReceipt = await redeemTx.wait();
    log(`Redeemed ${ethers.utils.formatEther(redeemAmount)} from banknote ${banknoteId}, transaction hash: ${redeemReceipt.transactionHash}`);

    // Check surplus funds
    const surplusFunds = await vault.getSurplus(signer.address, nzDollarAddress);
    log(`Surplus funds for signer: ${ethers.utils.formatEther(surplusFunds)} NZDollar`);

    // Skim surplus funds
    if (surplusFunds.gt(0)) {
      const skimTx = await vault.skimSurplus(nzDollarAddress, surplusFunds);
      const skimReceipt = await skimTx.wait();
      log(`Skimmed ${ethers.utils.formatEther(surplusFunds)} NZDollar, transaction hash: ${skimReceipt.transactionHash}`);
    } else {
      log("No surplus funds to skim");
    }

    // Final balance check
    const finalBalance = await nzDollar.balanceOf(signer.address);
    log(`Final NZDollar balance of signer: ${ethers.utils.formatEther(finalBalance)}`);

  } catch (error) {
    log(`Error: ${error.message}`);
    if (error.reason) log(`Reason: ${error.reason}`);
    if (error.code) log(`Code: ${error.code}`);
    if (error.transaction) log(`Transaction: ${JSON.stringify(error.transaction)}`);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    log(`Unhandled Error: ${error.message}`);
    process.exit(1);
  });