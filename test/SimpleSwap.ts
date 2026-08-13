import { expect } from "chai";
import hre from "hardhat";

const { ethers } = hre;

describe("SimpleSwap", function () {
  let swap: any;
  let tokenA: any;
  let tokenB: any;
  let owner: any;
  let user: any;

  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();
    const TestToken = await ethers.getContractFactory("TestToken");
    tokenA = await TestToken.deploy("Token A", "TKA", 6);
    tokenB = await TestToken.deploy("Token B", "TKB", 6);

    const SimpleSwap = await ethers.getContractFactory("SimpleSwap");
    swap = await SimpleSwap.deploy();

    await swap.createPair(await tokenA.getAddress(), await tokenB.getAddress());

    // Mint tokens to owner and user
    await tokenA.mint(owner.address, ethers.parseUnits("10000", 6));
    await tokenB.mint(owner.address, ethers.parseUnits("10000", 6));
    await tokenA.mint(user.address, ethers.parseUnits("1000", 6));
    await tokenB.mint(user.address, ethers.parseUnits("1000", 6));

    // Approvals
    await tokenA.approve(swap.target, ethers.MaxUint256);
    await tokenB.approve(swap.target, ethers.MaxUint256);
    await tokenA.connect(user).approve(swap.target, ethers.MaxUint256);
    await tokenB.connect(user).approve(swap.target, ethers.MaxUint256);

    // Add liquidity: 1000 A / 1000 B
    await swap.addLiquidity(
      await tokenA.getAddress(),
      await tokenB.getAddress(),
      ethers.parseUnits("1000", 6),
      ethers.parseUnits("1000", 6)
    );
  });

  it("creates a pair and tracks reserves", async () => {
    const [rA, rB] = await swap.getReserves(await tokenA.getAddress(), await tokenB.getAddress());
    expect(rA).to.equal(ethers.parseUnits("1000", 6));
    expect(rB).to.equal(ethers.parseUnits("1000", 6));
  });

  it("swaps A for B with correct output and fee", async () => {
    const amountIn = ethers.parseUnits("100", 6);
    const expectedOut = await swap.getAmountOut(amountIn, ethers.parseUnits("1000", 6), ethers.parseUnits("1000", 6));
    const balBefore = await tokenB.balanceOf(user.address);
    await swap.connect(user).swap(
      await tokenA.getAddress(),
      await tokenB.getAddress(),
      amountIn,
      0
    );
    const balAfter = await tokenB.balanceOf(user.address);
    expect(balAfter - balBefore).to.equal(expectedOut);
  });

  it("swaps B for A with correct output and fee", async () => {
    const amountIn = ethers.parseUnits("50", 6);
    const expectedOut = await swap.getAmountOut(amountIn, ethers.parseUnits("1000", 6), ethers.parseUnits("1000", 6));
    const balBefore = await tokenA.balanceOf(user.address);
    await swap.connect(user).swap(
      await tokenB.getAddress(),
      await tokenA.getAddress(),
      amountIn,
      0
    );
    const balAfter = await tokenA.balanceOf(user.address);
    expect(balAfter - balBefore).to.equal(expectedOut);
  });

  it("rejects swap with insufficient output", async () => {
    const amountIn = ethers.parseUnits("100", 6);
    await expect(
      swap.connect(user).swap(
        await tokenA.getAddress(),
        await tokenB.getAddress(),
        amountIn,
        ethers.parseUnits("999", 6) // impossibly high
      )
    ).to.be.reverted;
  });

  it("updates reserves after swap", async () => {
    const tokenAAddr = await tokenA.getAddress();
    const tokenBAddr = await tokenB.getAddress();
    await swap.connect(user).swap(tokenAAddr, tokenBAddr, ethers.parseUnits("100", 6), 0);
    const [r0, r1] = await swap.getReserves(tokenAAddr, tokenBAddr);
    // getReserves returns (reserveA, reserveB) where reserveA belongs to the sorted-first token
    // One reserve should increase by 100, the other should decrease
    const totalBefore = ethers.parseUnits("2000", 6);
    const totalAfter = r0 + r1;
    // Input (100) is fully added to reserves, output (~90.66) is subtracted
    // Total = 2000 + 100 - ~90.66 = ~2009.34
    expect(totalAfter).to.be.lessThan(totalBefore + ethers.parseUnits("100", 6));
    expect(totalAfter).to.be.greaterThan(totalBefore);
  });

  it("rejects swap on non-existent pair", async () => {
    const TestToken = await ethers.getContractFactory("TestToken");
    const tokenC = await TestToken.deploy("Token C", "TKC", 6);
    await tokenC.mint(user.address, ethers.parseUnits("100", 6));
    await tokenC.connect(user).approve(swap.target, ethers.MaxUint256);
    await expect(
      swap.connect(user).swap(
        await tokenA.getAddress(),
        await tokenC.getAddress(),
        ethers.parseUnits("10", 6),
        0
      )
    ).to.be.reverted;
  });

  it("allows additional liquidity provision", async () => {
    await swap.addLiquidity(
      await tokenA.getAddress(),
      await tokenB.getAddress(),
      ethers.parseUnits("500", 6),
      ethers.parseUnits("500", 6)
    );
    const [rA, rB] = await swap.getReserves(await tokenA.getAddress(), await tokenB.getAddress());
    expect(rA).to.equal(ethers.parseUnits("1500", 6));
    expect(rB).to.equal(ethers.parseUnits("1500", 6));
  });
});
