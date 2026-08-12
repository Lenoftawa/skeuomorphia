import hre from "hardhat";

async function main() {
  const ethers = hre.ethers;
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance));

  // 1. Deploy StableCoin (FLRD) — kept for faucet and backwards compatibility
  const StableCoin = await ethers.getContractFactory("StableCoin");
  const stableCoin = await StableCoin.deploy();
  await stableCoin.waitForDeployment();
  const stableCoinAddr = await stableCoin.getAddress();
  console.log("StableCoin (FLRD) deployed to:", stableCoinAddr);

  // 2. Deploy AssetRegistry
  const AssetRegistry = await ethers.getContractFactory("AssetRegistry");
  const assetRegistry = await AssetRegistry.deploy(deployer.address);
  await assetRegistry.waitForDeployment();
  const assetRegistryAddr = await assetRegistry.getAddress();
  console.log("AssetRegistry deployed to:", assetRegistryAddr);

  // 3. Deploy BearerNoteEscrow
  const BearerNoteEscrow = await ethers.getContractFactory("BearerNoteEscrow");
  const bearerNoteEscrow = await BearerNoteEscrow.deploy(assetRegistryAddr, deployer.address);
  await bearerNoteEscrow.waitForDeployment();
  const bearerNoteEscrowAddr = await bearerNoteEscrow.getAddress();
  console.log("BearerNoteEscrow deployed to:", bearerNoteEscrowAddr);

  // 4. Configure FLRD as a supported asset (6 decimals, 1–1000 unit range)
  const flrdPolicyTx = await assetRegistry.setAssetPolicy(
    stableCoinAddr,
    true,
    ethers.parseUnits("1", 6),
    ethers.parseUnits("1000", 6)
  );
  await flrdPolicyTx.wait();
  console.log("FLRD asset policy set (1–1000 FLRD)");

  // 5. Configure FXRP as a supported asset if the address is available
  // FTestXRP on Coston2: 0x0b6A3645c240605887a5532109323A3E12273dc7
  const fxrpAddress = process.env.NEXT_PUBLIC_FXRP_ADDRESS || "0x0b6A3645c240605887a5532109323A3E12273dc7";
  try {
    const fxrpPolicyTx = await assetRegistry.setAssetPolicy(
      fxrpAddress,
      true,
      ethers.parseUnits("1", 6),
      ethers.parseUnits("1000", 6)
    );
    await fxrpPolicyTx.wait();
    console.log("FXRP asset policy set (1–1000 FXRP) at:", fxrpAddress);
  } catch (err) {
    console.warn("Could not set FXRP policy (continuing with FLRD only):", err);
  }

  // 6. Mint initial FLRD supply to deployer for faucet/testing
  const mintTx = await stableCoin.mint(deployer.address, ethers.parseUnits("1000000", 6));
  await mintTx.wait();
  console.log("Minted 1,000,000 FLRD to deployer");

  console.log("\n--- DEPLOYMENT COMPLETE ---");
  console.log("Set these in your .env file:");
  console.log(`NEXT_PUBLIC_STABLECOIN_ADDRESS=${stableCoinAddr}`);
  console.log(`NEXT_PUBLIC_CASH_ESCROW_ADDRESS=`);
  console.log(`NEXT_PUBLIC_ASSET_REGISTRY_ADDRESS=${assetRegistryAddr}`);
  console.log(`NEXT_PUBLIC_BEARER_NOTE_ESCROW_ADDRESS=${bearerNoteEscrowAddr}`);
  console.log(`NEXT_PUBLIC_FXRP_ADDRESS=${fxrpAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
