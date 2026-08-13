export interface Transaction {
  amount: number;
  txHash: string;
  timestamp: string;
  tokenSymbol: string;
}

  export interface BanknoteData {
    banknoteID: string;
    denomination: number;
    burnerAccountPrivKey: string;
  }
  
  export interface TransactionResult {
    success: boolean;
    amount: number;
    change: number;
    merchantAddr: string;
    customerAddr: string;
    description: string;
    transactionHash: string;
  }