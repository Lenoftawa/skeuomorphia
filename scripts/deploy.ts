import hre from "hardhat";

async function main() {
  const ethers = hre.ethers;
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance));

  // 1. Deploy StableCoin (FLRD)
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

  // 4. Deploy SimpleSwap
  const SimpleSwap = await ethers.getContractFactory("SimpleSwap");
  const simpleSwap = await SimpleSwap.deploy();
  await simpleSwap.waitForDeployment();
  const simpleSwapAddr = await simpleSwap.getAddress();
  console.log("SimpleSwap deployed to:", simpleSwapAddr);

  // 5. Configure FLRD as a supported asset (6 decimals, 1–1000 unit range)
  const flrdPolicyTx = await assetRegistry.setAssetPolicy(
    stableCoinAddr,
    true,
    ethers.parseUnits("1", 6),
    ethers.parseUnits("1000", 6)
  );
  await flrdPolicyTx.wait();
  console.log("FLRD asset policy set (1–1000 FLRD)");

  // 6. Configure FXRP as a supported asset
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

  // 7. Mint initial FLRD supply to deployer for faucet/testing
  const mintTx = await stableCoin.mint(deployer.address, ethers.parseUnits("1000000", 6));
  await mintTx.wait();
  console.log("Minted 1,000,000 FLRD to deployer");

  // 8. Create swap pair FLRD/FXRP and seed liquidity
  try {
    await (await simpleSwap.createPair(stableCoinAddr, fxrpAddress)).wait();
    console.log("Swap pair FLRD/FXRP created");

    // Approve SimpleSwap to spend deployer's tokens
    await (await stableCoin.approve(simpleSwapAddr, ethers.MaxUint256)).wait();

    // Get some FXRP — we can't mint FXRP directly, so we seed with FLRD only
    // The pair will have FLRD liquidity; FXRP side requires FXRP tokens
    // For now, seed with FLRD on both sides using our own StableCoin as proxy
    // Actually, we need real FXRP. Let's seed FLRD/FXRP if we have FXRP.
    const fxrpContract = new ethers.Contract(
      fxrpAddress,
      ["function balanceOf(address) view returns (uint256)", "function approve(address,uint256) returns (bool)"],
      deployer
    );
    const fxrpBal = await fxrpContract.balanceOf(deployer.address);
    if (fxrpBal > 0) {
      await (await fxrpContract.approve(simpleSwapAddr, ethers.MaxUint256)).wait();
      const seedAmount = ethers.parseUnits("500", 6);
      const actualSeed = fxrpBal < seedAmount ? fxrpBal : seedAmount;
      await (await simpleSwap.addLiquidity(stableCoinAddr, fxrpAddress, seedAmount, actualSeed)).wait();
      console.log(`Seeded FLRD/FXRP pair with 500 FLRD + ${ethers.formatUnits(actualSeed, 6)} FXRP`);
    } else {
      console.log("No FXRP balance for deployer — swap pair created but unseeded. Add liquidity manually.");
    }
  } catch (err) {
    console.warn("Could not create/seed swap pair:", err);
  }

  // 9. Create swap pair FLRD/WFLR and seed with FLRD (WFLR requires wrapping native)
  try {
    const wnatAddress = "0xC67DCE33D7A8efA5FfEB961899C73fe01bCe9273";
    await (await simpleSwap.createPair(stableCoinAddr, wnatAddress)).wait();
    console.log("Swap pair FLRD/WFLR created");
    // Seeding WFLR requires wrapping native FLR first — skip for now
    console.log("FLRD/WFLR pair created but unseeded. Add liquidity manually.");
  } catch (err) {
    console.warn("Could not create FLRD/WFLR pair:", err);
  }

  console.log("\n--- DEPLOYMENT COMPLETE ---");
  console.log("Set these in your .env file:");
  console.log(`NEXT_PUBLIC_STABLECOIN_ADDRESS=${stableCoinAddr}`);
  console.log(`NEXT_PUBLIC_CASH_ESCROW_ADDRESS=`);
  console.log(`NEXT_PUBLIC_ASSET_REGISTRY_ADDRESS=${assetRegistryAddr}`);
  console.log(`NEXT_PUBLIC_BEARER_NOTE_ESCROW_ADDRESS=${bearerNoteEscrowAddr}`);
  console.log(`NEXT_PUBLIC_FXRP_ADDRESS=${fxrpAddress}`);
  console.log(`NEXT_PUBLIC_SIMPLE_SWAP_ADDRESS=${simpleSwapAddr}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
