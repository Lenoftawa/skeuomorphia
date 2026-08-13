const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NZDollar", function () {
  let NZDollar;
  let nzDollar;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    NZDollar = await ethers.getContractFactory("NZDollar");
    [owner, addr1, addr2] = await ethers.getSigners();
    nzDollar = await NZDollar.deploy(ethers.utils.parseEther("1000000"));
    await nzDollar.deployed();
  });

  it("Should have correct name and symbol", async function () {
    expect(await nzDollar.name()).to.equal("New Zealand Dollar");
    expect(await nzDollar.symbol()).to.equal("NZDT");
  });

  it("Should mint initial supply to owner", async function () {
    const ownerBalance = await nzDollar.balanceOf(owner.address);
    expect(ownerBalance).to.equal(ethers.utils.parseEther("999000")); // 1000000 - 1000 (transferred in constructor)
  });

  it("Should transfer initial amount to specified address", async function () {
    const recipientBalance = await nzDollar.balanceOf("0xD0E31F3Bd528b17DB25Af9a6014B56D2E3B6d773");
    expect(recipientBalance).to.equal(ethers.utils.parseEther("1000"));
  });
});