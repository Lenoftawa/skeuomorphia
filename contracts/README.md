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