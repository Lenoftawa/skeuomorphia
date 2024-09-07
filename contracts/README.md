# Banknote Collateral Vault

This project implements a smart contract system for minting and redeeming digital banknotes backed by ERC20 tokens. It consists of two main contracts:

1. `BanknoteCollateralVault`: Handles the minting, redemption, and management of digital banknotes.
2. `NZDollar`: A simple ERC20 token used for testing purposes.

## Contracts Overview

### BanknoteCollateralVault

This contract allows users to:
- Mint digital banknotes by locking ERC20 tokens
- Redeem banknotes for the underlying tokens
- Manage surplus funds from partial redemptions

Key features:
- Supports multiple denominations
- Uses a hashing mechanism for secure redemption
- Implements reentrancy protection

### NZDollar

A basic ERC20 token contract used for testing the vault contract. It mints an initial supply to the deployer and transfers a small amount to a predefined address.

## Setting Up the Project

1. Clone the repository:
   ```
   git clone <repository-url>
   cd <project-directory>
   ```

2. Install dependencies:
   ```
   npm install
   ```

## Running Tests

To run the test suite:

1. Ensure you're in the project root directory.

2. Run the following command:
   ```
   npx hardhat test
   ```

This will compile the contracts and run all the tests defined in the `test` directory.

## Test Structure

The test files are located in the `test` directory:

- `BanknoteCollateralVault.test.js`: Tests for the vault contract functionality
- `NZDollar.test.js`: Tests for the NZDollar token contract

The tests cover various scenarios including:
- Minting banknotes
- Redeeming banknotes
- Checking token balances and transfers

## Development

To modify or extend the contracts:

1. Edit the Solidity files in the `contracts` directory.
2. Update or add tests in the `test` directory as needed.
3. Run `npx hardhat compile` to compile your changes.
4. Run the tests to ensure everything is working as expected.

## Hedera

To view your contract on the Hedera Testnet explorer:

https://hashscan.io/testnet

Test Hedera Connection:

`node test-connection.js`

Compile the contracts:

`npx hardhat compile`

Run the tests:

`npx hardhat test`

Deploy the contracts to Hedera testnet:

`npx hardhat run scripts/deploy.js --network hedera`
`npx hardhat run scripts/deploy.js --network sepolia`

Interact with the deployed contracts:

`npx hardhat run scripts/interact.js --network hedera`
`npx hardhat run scripts/interact.js --network sepolia`

Replace the placeholder contract addresses (nzDollarAddress and vaultAddress) with your actual deployed contract addresses.

---

Create a Hedera Testnet Account:

1. Go to the Hedera Portal: https://portal.hedera.com/
2. Click on "Get started with testnet"
3. Sign up for an account if you don't have one


Access Your Testnet Account:

1. After logging in, go to "Access testnet account"
2. You'll see your Account ID and Private Key

---

Use the Hedera Token Service (HTS) instead of the custom ERC20 token for better integration with Hedera's native features.

Use the Hedera Consensus Service (HCS) for additional features like timestamping or audit trails.


vault sep eth testnet: 0xbf26b234f3e48b32cfdad055b31a99c19cb45557
nzdt sep eth testnet: 0xaB0e2aEF0d236E0754E79eD34380a0Ec9700fE02

alt nzdt sep eth: 0x42EBbDEB6Da974688E9aADCdAEca707903819dCF
mock usdc sep eth: 0x4BE07C0892B67070dc26d3382aD153b546013AB6
mock eurc sep eth: 0x43db875d0397B43F129C67EA85DBA7B2dD55d1cD

new (9/7) vault sep eth testnet: 0xf2432ad28c2242581439978ec53843ad16693531


minter:

priv: 0xE6d6F4a7857f0C9ED735397e9bbA36f093752872

pk: e6910ac208dad070b17d8460e404ee1be9bf35c8825a0276488ba904548c1197

redeemer:

pub: 0xf49bb7a00B406F2870c76135CF21bf111954fCf4

pk: 9910be605dda641b1d0fc482a8b7c0e2eb274ad2cebdbbd37dc477d880425430