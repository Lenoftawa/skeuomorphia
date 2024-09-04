const { Client, AccountBalanceQuery } = require("@hashgraph/sdk");
require('dotenv').config();

async function main() {
  const myAccountId = process.env.HEDERA_ACCOUNT_ID;
  const myPrivateKey = process.env.HEDERA_PRIVATE_KEY;

  if (!myAccountId || !myPrivateKey) {
    throw new Error("Environment variables HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY must be present");
  }

  const client = Client.forTestnet();
  client.setOperator(myAccountId, myPrivateKey);

  const balance = await new AccountBalanceQuery()
    .setAccountId(myAccountId)
    .execute(client);

  console.log(`My account balance is: ${balance.hbars} HBAR`);
}

main();