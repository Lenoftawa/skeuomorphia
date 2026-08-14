/**
 * Deploy only the updated BearerNoteEscrow (with FDC gating) to Coston2.
 * Reuses the existing AssetRegistry. Sets the compliance URL prefix.
 *
 * Run: npx hardhat run scripts/deploy-escrow-fdc.ts --network coston2
 */
import hre from "hardhat";

async function main() {
  const ethers = hre.ethers;
  const [deployer] = await ethers.getSigners();
  console.log("Deploying BearerNoteEscrow (FDC) with:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "C2FLR");

  // Reuse the existing AssetRegistry from .env
  const assetRegistryAddr = process.env.NEXT_PUBLIC_ASSET_REGISTRY_ADDRESS;
  if (!assetRegistryAddr) throw new Error("NEXT_PUBLIC_ASSET_REGISTRY_ADDRESS not set in .env");
  console.log("Reusing AssetRegistry at:", assetRegistryAddr);

  // Deploy updated BearerNoteEscrow
  const BearerNoteEscrow = await ethers.getContractFactory("BearerNoteEscrow");
  const escrow = await BearerNoteEscrow.deploy(assetRegistryAddr, deployer.address);
  await escrow.waitForDeployment();
  const escrowAddr = await escrow.getAddress();
  console.log("BearerNoteEscrow (FDC) deployed to:", escrowAddr);

  // Set the compliance URL prefix.
  // This must be a public HTTPS URL that FDC data providers can fetch.
  // For now, use a placeholder — update after public deploy.
  const complianceUrl = process.env.COMPLIANCE_URL_PREFIX || "https://flare-terminal.vercel.app/api/compliance?address=";
  const tx = await escrow.setComplianceUrlPrefix(complianceUrl);
  await tx.wait();
  console.log("Compliance URL prefix set to:", complianceUrl);
  console.log("  tx:", tx.hash);

  // Verify the config
  const setPrefix = await escrow.complianceUrlPrefix();
  const maxAge = await escrow.complianceMaxAge();
  console.log("Verified complianceUrlPrefix:", setPrefix);
  console.log("Verified complianceMaxAge:", maxAge.toString(), "seconds");

  console.log("\n--- DEPLOYMENT COMPLETE ---");
  console.log("Update .env:");
  console.log(`NEXT_PUBLIC_BEARER_NOTE_ESCROW_ADDRESS=${escrowAddr}`);
  console.log(`COMPLIANCE_URL_PREFIX=${complianceUrl}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
