const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const NZDollar = await ethers.getContractFactory("NZDollar");
  const nzDollar = await NZDollar.deploy(ethers.utils.parseEther("1000000"));
  await nzDollar.deployed();

  console.log("NZDollar deployed to:", nzDollar.address);

  const BanknoteCollateralVault = await ethers.getContractFactory("BanknoteCollateralVault");
  const vault = await BanknoteCollateralVault.deploy(deployer.address);
  await vault.deployed();

  console.log("BanknoteCollateralVault deployed to:", vault.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });