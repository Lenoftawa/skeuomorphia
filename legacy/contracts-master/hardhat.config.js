require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

module.exports = {
  solidity: "0.8.19",
  networks: {
    // hedera: {
    //   url: `https://${process.env.HEDERA_NETWORK}.hashio.io/api`,
    //   accounts: [`0x${process.env.HEDERA_PRIVATE_KEY}`],
    //   chainId: process.env.HEDERA_NETWORK === 'testnet' ? 296 : 295,
    // },
    sepolia: {
      url: process.env.SEPOLIA_URL,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 11155111,
    },
  },
};