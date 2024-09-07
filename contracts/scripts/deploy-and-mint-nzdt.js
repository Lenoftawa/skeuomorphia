const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const initialSupply = ethers.utils.parseEther("1000000"); // 1 million NZDT
  const NZDollar = await ethers.getContractFactory("NZDollar");
  const nzDollar = await NZDollar.deploy(initialSupply);

  await nzDollar.deployed();

  console.log("NZDollar deployed to:", nzDollar.address);

  // Mint 10,000 NZDT to the specified address
  const mintAmount = ethers.utils.parseEther("10000");
  const mintTo = "0xE6d6F4a7857f0C9ED735397e9bbA36f093752872";

  console.log(`Minting ${ethers.utils.formatEther(mintAmount)} NZDT to ${mintTo}`);

  const mintTx = await nzDollar.transfer(mintTo, mintAmount);
  await mintTx.wait();

  console.log("Minting completed");

  // Check balance
  const balance = await nzDollar.balanceOf(mintTo);
  console.log(`Balance of ${mintTo}: ${ethers.utils.formatEther(balance)} NZDT`);

  console.log("NZDollar contract address:", nzDollar.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });