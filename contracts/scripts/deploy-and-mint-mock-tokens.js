const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy MockUSDC
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy();
  await mockUSDC.deployed();
  console.log("MockUSDC deployed to:", mockUSDC.address);

  // Deploy MockEURC
  const MockEURC = await ethers.getContractFactory("MockEURC");
  const mockEURC = await MockEURC.deploy();
  await mockEURC.deployed();
  console.log("MockEURC deployed to:", mockEURC.address);

  // Mint tokens
  const mintTo = "0xE6d6F4a7857f0C9ED735397e9bbA36f093752872";
  const mintAmount = ethers.utils.parseUnits("100000", 6); // 100,000 tokens with 6 decimals

  console.log(`Minting 100,000 USDC to ${mintTo}`);
  await mockUSDC.mint(mintTo, mintAmount);

  console.log(`Minting 100,000 EURC to ${mintTo}`);
  await mockEURC.mint(mintTo, mintAmount);

  // Check balances
  const usdcBalance = await mockUSDC.balanceOf(mintTo);
  const eurcBalance = await mockEURC.balanceOf(mintTo);

  console.log(`USDC balance of ${mintTo}: ${ethers.utils.formatUnits(usdcBalance, 6)} USDC`);
  console.log(`EURC balance of ${mintTo}: ${ethers.utils.formatUnits(eurcBalance, 6)} EURC`);

  console.log("MockUSDC contract address:", mockUSDC.address);
  console.log("MockEURC contract address:", mockEURC.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });