import hre from "hardhat";

async function main() {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();
  const stableCoinAddress = process.env.NEXT_PUBLIC_STABLECOIN_ADDRESS;
  const fxrpAddress = process.env.NEXT_PUBLIC_FXRP_ADDRESS;
  if (!stableCoinAddress || !fxrpAddress) throw new Error("FLRD and FXRP addresses are required");

  const provider = ethers.provider;
  if (await provider.getCode(stableCoinAddress) === "0x") throw new Error("FLRD contract not found");
  if (await provider.getCode(fxrpAddress) === "0x") throw new Error("FXRP contract not found");

  const SimpleSwap = await ethers.getContractFactory("SimpleSwap");
  const simpleSwap = await SimpleSwap.deploy();
  await simpleSwap.waitForDeployment();
  const simpleSwapAddress = await simpleSwap.getAddress();

  const feedId = `0x${(`01${Buffer.from("XRP/USD").toString("hex")}`).padEnd(42, "0")}`;
  const feeCalculator = new ethers.Contract(
    "0x88A9315f96c9b5518BBeC58dC6a914e13fAb13e2",
    ["function calculateFeeByIds(bytes21[] feedIds) view returns (uint256)"],
    provider
  );
  const ftsoV2 = new ethers.Contract(
    "0xC4e9c78EA53db782E28f28Fdf80BaF59336B304d",
    ["function getFeedsById(bytes21[] feedIds) payable returns (uint256[] values, int8[] decimals, uint64 timestamp)"],
    provider
  );
  const fee = await feeCalculator.calculateFeeByIds([feedId]);
  const [values, decimals] = await ftsoV2.getFeedsById.staticCall([feedId], { value: fee });
  const decimalPlaces = Number(decimals[0]);
  const xrpPrice = decimalPlaces >= 0
    ? Number(ethers.formatUnits(values[0], decimalPlaces))
    : Number(values[0]) * 10 ** Math.abs(decimalPlaces);

  const erc20Abi = [
    "function balanceOf(address) view returns (uint256)",
    "function approve(address,uint256) returns (bool)",
  ];
  const flrd = new ethers.Contract(stableCoinAddress, erc20Abi, deployer);
  const fxrp = new ethers.Contract(fxrpAddress, erc20Abi, deployer);
  const fxrpBalance = await fxrp.balanceOf(deployer.address);
  const fxrpSeed = fxrpBalance > ethers.parseUnits("9", 6) ? ethers.parseUnits("9", 6) : fxrpBalance;
  if (fxrpSeed === 0n) throw new Error("No FXRP available to seed liquidity");
  const flrdSeed = ethers.parseUnits((Number(ethers.formatUnits(fxrpSeed, 6)) * xrpPrice).toFixed(6), 6);

  await (await simpleSwap.createPair(stableCoinAddress, fxrpAddress)).wait();
  await (await flrd.approve(simpleSwapAddress, flrdSeed)).wait();
  await (await fxrp.approve(simpleSwapAddress, fxrpSeed)).wait();
  await (await simpleSwap.addLiquidity(stableCoinAddress, fxrpAddress, flrdSeed, fxrpSeed)).wait();

  console.log(`SIMPLE_SWAP_ADDRESS=${simpleSwapAddress}`);
  console.log(`XRP_USD=${xrpPrice}`);
  console.log(`FLRD_LIQUIDITY=${ethers.formatUnits(flrdSeed, 6)}`);
  console.log(`FXRP_LIQUIDITY=${ethers.formatUnits(fxrpSeed, 6)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
