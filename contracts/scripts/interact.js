const { ethers } = require("hardhat");
const fs = require('fs');

async function getTokenDecimals(token) {
  try {
    return await token.decimals();
  } catch (error) {
    console.log("Token doesn't have a decimals function, defaulting to 18");
    return 18;
  }
}

async function mintAndRedeemBanknote(vault, token, tokenName, denomination, signer) {
  console.log(`\nTesting with ${tokenName}:`);
  console.log(`Denomination: ${denomination} ${tokenName}`);

  try {
    const decimals = await getTokenDecimals(token);
    
    // 1. Check signer's token balance
    const signerBalance = await token.balanceOf(signer.address);
    console.log(`Signer ${tokenName} balance: ${ethers.utils.formatUnits(signerBalance, decimals)} ${tokenName}`);

    const amount = ethers.utils.parseUnits(denomination.toString(), decimals);

    if (signerBalance.lt(amount)) {
      console.log(`Insufficient ${tokenName} balance. Skipping.`);
      return;
    }

    // 2. Approve spending
    console.log(`Approving ${tokenName} spending...`);
    const approveTx = await token.connect(signer).approve(vault.address, amount.mul(2));
    await approveTx.wait();
    console.log(`Approved ${tokenName} spending`);

    // 3. Mint banknote
    console.log("Minting banknote...");
    const banknoteWallet = ethers.Wallet.createRandom();
    const mintTx = await vault.connect(signer).mintBanknote(
      token.address,
      banknoteWallet.address,
      denomination,
      { gasLimit: 500000 }
    );

    const mintReceipt = await mintTx.wait();
    console.log("Banknote minted:", mintReceipt.transactionHash);

    const banknoteEvent = mintReceipt.events.find(e => e.event === 'banknoteMinted');
    const banknoteId = banknoteEvent.args.id;

    // 4. Display banknote details
    console.log(`Minted banknote with ID ${banknoteId}`);
    console.log(`Banknote Private Key: ${banknoteWallet.privateKey}`);
    console.log(`Banknote Public Address: ${banknoteWallet.address}`);

    const banknoteInfo = await vault.getBanknoteInfo(banknoteId);
    console.log("Banknote info:", banknoteInfo);

    // 5. Redeem banknote
    console.log("Redeeming banknote...");
    const redeemAmount = amount;
    const signature = await banknoteWallet.signMessage(ethers.utils.arrayify(ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(['address'], [signer.address]))));
    const description = ethers.utils.formatBytes32String("Test redemption");

    const redeemTx = await vault.connect(signer).redeemBanknote(
      banknoteId,
      redeemAmount,
      signature,
      description,
      { gasLimit: 500000 }
    );
    const redeemReceipt = await redeemTx.wait();
    console.log("Banknote redeemed:", redeemReceipt.transactionHash);

    // 6. Check final balances and surplus
    const finalSignerBalance = await token.balanceOf(signer.address);
    const surplusBalance = await vault.getSurplus(signer.address, token.address);

    console.log(`Final Signer ${tokenName} balance: ${ethers.utils.formatUnits(finalSignerBalance, decimals)} ${tokenName}`);
    console.log(`Surplus ${tokenName} balance: ${ethers.utils.formatUnits(surplusBalance, decimals)} ${tokenName}`);

    // Skim surplus
    if (surplusBalance.gt(0)) {
      console.log("Skimming surplus...");
      const skimTx = await vault.connect(signer).skimSurplus(token.address, 0);
      await skimTx.wait();
      console.log("Surplus skimmed");
    }
  } catch (error) {
    console.error(`Error with ${tokenName}:`, error.message);
    if (error.reason) console.error("Reason:", error.reason);
    if (error.data) console.error("Error data:", error.data);
  }
}

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Using account:", signer.address);

  const addresses = JSON.parse(fs.readFileSync("deployed-addresses.json"));
  const vaultAddress = addresses.vault;
  console.log("Using vault contract at:", vaultAddress);

  const BanknoteCollateralVault = await ethers.getContractFactory("BanknoteCollateralVault");
  const vault = BanknoteCollateralVault.attach(vaultAddress);

  // ERC20 tokens
  const tokens = [
    { address: addresses.usdc, name: "USDC", denomination: 2 },
    { address: addresses.eurc, name: "EURC", denomination: 2 },
    { address: addresses.nzdt, name: "NZDT", denomination: 2 }
  ];

  for (const tokenInfo of tokens) {
    const token = await ethers.getContractAt("IERC20", tokenInfo.address);
    await mintAndRedeemBanknote(vault, token, tokenInfo.name, tokenInfo.denomination, signer);
  }

  // ETH
  console.log("\nTesting with ETH:");
  const ethDenomination = 2; // Using 2 as denomination for consistency with ERC20 tokens
  console.log(`Denomination: ${ethDenomination} ETH`);

  try {
    const signerBalance = await signer.getBalance();
    console.log(`Signer ETH balance: ${ethers.utils.formatEther(signerBalance)} ETH`);

    const ethAmount = ethers.utils.parseEther(ethDenomination.toString());

    if (signerBalance.lt(ethAmount)) {
      console.log("Insufficient ETH balance. Skipping.");
      return;
    }

    console.log("Minting ETH banknote...");
    const banknoteWallet = ethers.Wallet.createRandom();
    const mintTx = await vault.connect(signer).mintBanknote(
      ethers.constants.AddressZero,
      banknoteWallet.address,
      ethDenomination,
      { value: ethAmount, gasLimit: 500000 }
    );

    const mintReceipt = await mintTx.wait();
    console.log("ETH Banknote minted:", mintReceipt.transactionHash);

    const banknoteEvent = mintReceipt.events.find(e => e.event === 'banknoteMinted');
    const banknoteId = banknoteEvent.args.id;

    console.log(`Minted ETH banknote with ID ${banknoteId}`);
    console.log(`Banknote Private Key: ${banknoteWallet.privateKey}`);
    console.log(`Banknote Public Address: ${banknoteWallet.address}`);

    const banknoteInfo = await vault.getBanknoteInfo(banknoteId);
    console.log("ETH Banknote info:", banknoteInfo);

    // Redeem ETH banknote
    console.log("Redeeming ETH banknote...");
    const signature = await banknoteWallet.signMessage(ethers.utils.arrayify(ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(['address'], [signer.address]))));
    const description = ethers.utils.formatBytes32String("Test ETH redemption");

    const redeemTx = await vault.connect(signer).redeemBanknote(
      banknoteId,
      ethAmount,
      signature,
      description,
      { gasLimit: 500000 }
    );
    const redeemReceipt = await redeemTx.wait();
    console.log("ETH Banknote redeemed:", redeemReceipt.transactionHash);

    const finalSignerBalance = await signer.getBalance();
    const surplusBalance = await vault.getSurplus(signer.address, ethers.constants.AddressZero);

    console.log(`Final Signer ETH balance: ${ethers.utils.formatEther(finalSignerBalance)} ETH`);
    console.log(`Surplus ETH balance: ${ethers.utils.formatEther(surplusBalance)} ETH`);

    // Skim surplus
    if (surplusBalance.gt(0)) {
      console.log("Skimming ETH surplus...");
      const skimTx = await vault.connect(signer).skimSurplus(ethers.constants.AddressZero, 0);
      await skimTx.wait();
      console.log("ETH Surplus skimmed");
    }
  } catch (error) {
    console.error("Error with ETH:", error.message);
    if (error.reason) console.error("Reason:", error.reason);
    if (error.data) console.error("Error data:", error.data);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });