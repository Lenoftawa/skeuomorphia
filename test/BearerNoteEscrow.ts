import { expect } from "chai";
import hre from "hardhat";

const { ethers } = hre;
const units = (value: string) => ethers.parseUnits(value, 6);
const secret = ethers.keccak256(ethers.toUtf8Bytes("note-secret"));
const secretHash = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["bytes32"], [secret]));

function commitment(merchant: string, noteId: bigint, amount: bigint) {
  return ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ["bytes32", "address", "uint256", "uint256"],
      [secret, merchant, noteId, amount]
    )
  );
}

describe("BearerNoteEscrow", function () {
  async function deployFixture() {
    const [owner, issuer, merchant, attacker] = await ethers.getSigners();
    const token = await ethers.deployContract("TestToken", ["Test FXRP", "FXRP", 6]);
    const registry = await ethers.deployContract("AssetRegistry", [owner.address]);
    const escrow = await ethers.deployContract("BearerNoteEscrow", [await registry.getAddress(), owner.address]);

    await registry.setAssetPolicy(await token.getAddress(), true, units("1"), units("1000"));
    await token.mint(issuer.address, units("1000"));
    await token.connect(issuer).approve(await escrow.getAddress(), ethers.MaxUint256);

    return { owner, issuer, merchant, attacker, token, registry, escrow };
  }

  async function mintNote(fixture: Awaited<ReturnType<typeof deployFixture>>, value = units("100")) {
    await fixture.escrow.connect(fixture.issuer).mintNote(await fixture.token.getAddress(), value, secretHash, 0);
    return 1n;
  }

  it("mints an allowlisted ERC-20 bearer note", async function () {
    const fixture = await deployFixture();
    await expect(fixture.escrow.connect(fixture.issuer).mintNote(await fixture.token.getAddress(), units("100"), secretHash, 0))
      .to.emit(fixture.escrow, "NoteMinted")
      .withArgs(1n, await fixture.token.getAddress(), fixture.issuer.address, units("100"), 0);

    expect(await fixture.token.balanceOf(await fixture.escrow.getAddress())).to.equal(units("100"));
  });

  it("rejects assets that are not allowlisted", async function () {
    const fixture = await deployFixture();
    const other = await ethers.deployContract("TestToken", ["Other", "OTHER", 18]);
    await other.mint(fixture.issuer.address, ethers.parseEther("100"));
    await other.connect(fixture.issuer).approve(await fixture.escrow.getAddress(), ethers.MaxUint256);

    await expect(fixture.escrow.connect(fixture.issuer).mintNote(await other.getAddress(), ethers.parseEther("10"), secretHash, 0))
      .to.be.revertedWithCustomError(fixture.registry, "UnsupportedAsset");
  });

  it("redeems a full note after commit maturity", async function () {
    const fixture = await deployFixture();
    const noteId = await mintNote(fixture);
    const amount = units("100");

    await fixture.escrow.connect(fixture.merchant).commitRedemption(noteId, commitment(fixture.merchant.address, noteId, amount));
    await ethers.provider.send("evm_mine", []);
    await expect(fixture.escrow.connect(fixture.merchant).redeemNote(noteId, secret, amount))
      .to.emit(fixture.escrow, "NoteRedeemed")
      .withArgs(noteId, await fixture.token.getAddress(), fixture.merchant.address, fixture.issuer.address, amount, 0);

    expect(await fixture.token.balanceOf(fixture.merchant.address)).to.equal(amount);
  });

  it("returns unused value to the issuer on partial redemption", async function () {
    const fixture = await deployFixture();
    const noteId = await mintNote(fixture);
    const amount = units("35");
    const issuerBefore = await fixture.token.balanceOf(fixture.issuer.address);

    await fixture.escrow.connect(fixture.merchant).commitRedemption(noteId, commitment(fixture.merchant.address, noteId, amount));
    await ethers.provider.send("evm_mine", []);
    await fixture.escrow.connect(fixture.merchant).redeemNote(noteId, secret, amount);

    expect(await fixture.token.balanceOf(fixture.merchant.address)).to.equal(amount);
    expect(await fixture.token.balanceOf(fixture.issuer.address)).to.equal(issuerBefore + units("65"));
    expect(await fixture.token.balanceOf(await fixture.escrow.getAddress())).to.equal(0);
  });

  it("prevents another account from front-running a redemption", async function () {
    const fixture = await deployFixture();
    const noteId = await mintNote(fixture);
    const amount = units("50");

    await fixture.escrow.connect(fixture.merchant).commitRedemption(noteId, commitment(fixture.merchant.address, noteId, amount));
    await ethers.provider.send("evm_mine", []);
    await expect(fixture.escrow.connect(fixture.attacker).redeemNote(noteId, secret, amount))
      .to.be.revertedWithCustomError(fixture.escrow, "InvalidCommitment");
  });

  it("rejects an incorrect secret and amount changed after commit", async function () {
    const fixture = await deployFixture();
    const noteId = await mintNote(fixture);
    const amount = units("50");

    await fixture.escrow.connect(fixture.merchant).commitRedemption(noteId, commitment(fixture.merchant.address, noteId, amount));
    await ethers.provider.send("evm_mine", []);
    await expect(fixture.escrow.connect(fixture.merchant).redeemNote(noteId, secret, units("51")))
      .to.be.revertedWithCustomError(fixture.escrow, "InvalidCommitment");
    await expect(fixture.escrow.connect(fixture.merchant).redeemNote(noteId, ethers.ZeroHash, amount))
      .to.be.revertedWithCustomError(fixture.escrow, "InvalidCommitment");
  });

  it("prevents replay and double redemption", async function () {
    const fixture = await deployFixture();
    const noteId = await mintNote(fixture);
    const amount = units("100");

    await fixture.escrow.connect(fixture.merchant).commitRedemption(noteId, commitment(fixture.merchant.address, noteId, amount));
    await ethers.provider.send("evm_mine", []);
    await fixture.escrow.connect(fixture.merchant).redeemNote(noteId, secret, amount);
    await expect(fixture.escrow.connect(fixture.merchant).redeemNote(noteId, secret, amount))
      .to.be.revertedWithCustomError(fixture.escrow, "NoteAlreadyRedeemed");
  });

  it("allows the issuer to cancel with the secret", async function () {
    const fixture = await deployFixture();
    const noteId = await mintNote(fixture);

    await expect(fixture.escrow.connect(fixture.issuer).cancelNote(noteId, secret))
      .to.emit(fixture.escrow, "NoteCancelled");
    expect(await fixture.token.balanceOf(fixture.issuer.address)).to.equal(units("1000"));
  });

  it("enforces pause controls while allowing cancellation", async function () {
    const fixture = await deployFixture();
    const noteId = await mintNote(fixture);
    await fixture.escrow.pause();

    await expect(fixture.escrow.connect(fixture.issuer).mintNote(await fixture.token.getAddress(), units("10"), secretHash, 0))
      .to.be.revertedWithCustomError(fixture.escrow, "EnforcedPause");
    await fixture.escrow.connect(fixture.issuer).cancelNote(noteId, secret);
    expect(await fixture.token.balanceOf(fixture.issuer.address)).to.equal(units("1000"));
  });
});
