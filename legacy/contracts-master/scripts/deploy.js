const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const BanknoteCollateralVault = await ethers.getContractFactory("BanknoteCollateralVault");
  const vault = await BanknoteCollateralVault.deploy(deployer.address);
  await vault.deployed();

  console.log("BanknoteCollateralVault deployed to:", vault.address);

  const addresses = {
    vault: vault.address,
    usdc: "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8",
    eurc: "0x08210F9170F89Ab7658F0B5E3fF39b0E03C594D4"
  };

  fs.writeFileSync("deployed-addresses.json", JSON.stringify(addresses, null, 2));
  console.log("Contract addresses saved to deployed-addresses.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });