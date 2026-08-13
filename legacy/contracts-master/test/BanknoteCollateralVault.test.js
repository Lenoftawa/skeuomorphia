const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BanknoteCollateralVault", function () {
  let BanknoteCollateralVault;
  let vault;
  let NZDollar;
  let nzDollar;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    NZDollar = await ethers.getContractFactory("NZDollar");
    nzDollar = await NZDollar.deploy(ethers.utils.parseEther("1000000"));
    await nzDollar.deployed();

    BanknoteCollateralVault = await ethers.getContractFactory("BanknoteCollateralVault");
    vault = await BanknoteCollateralVault.deploy(owner.address);
    await vault.deployed();
  });

  it("Should mint a banknote", async function () {
    const denomination = 100;
    const hashedSecret = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("secret"));
    
    await nzDollar.approve(vault.address, ethers.utils.parseEther("100"));
    
    await expect(vault.mintBanknote(nzDollar.address, hashedSecret, denomination))
      .to.emit(vault, "banknoteMinted")
      .withArgs(owner.address, nzDollar.address, 0, denomination);
  });

  it("Should redeem a banknote", async function () {
    const denomination = 100;
    const secret = ethers.utils.randomBytes(32);
    const hashedSecret = ethers.utils.keccak256(secret);
    
    await nzDollar.approve(vault.address, ethers.utils.parseEther("100"));
    await vault.mintBanknote(nzDollar.address, hashedSecret, denomination);
    
    const amount = ethers.utils.parseEther("50");
    const discount = ethers.utils.parseEther("1");
    
    // Update this line to match the contract's hashing method
    const hash2 = ethers.utils.keccak256(ethers.utils.solidityPack(["bytes32", "address"], [hashedSecret, addr1.address]));
    
    await expect(vault.connect(addr1).redeemBanknote(0, amount, hash2, discount))
      .to.emit(vault, "banknoteRedeemed")
      .withArgs(owner.address, nzDollar.address, amount, discount, 0);
  });
});