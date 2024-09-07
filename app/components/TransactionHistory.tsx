import React from 'react';
import { Transaction } from '../types';

interface TransactionHistoryProps {
  transactions: Transaction[];
  language: string;
  currency: string;
}

const translations = {
  English: {
    recentTransactions: "Recent Transactions",
    noTransactions: "No transactions yet.",
    amount: "Amount",
    transactionId: "Transaction ID",
    date: "Date"
  },
  Spanish: {
    recentTransactions: "Transacciones Recientes",
    noTransactions: "Aún no hay transacciones.",
    amount: "Monto",
    transactionId: "ID de Transacción",
    date: "Fecha"
  },
  French: {
    recentTransactions: "Transactions Récentes",
    noTransactions: "Pas encore de transactions.",
    amount: "Montant",
    transactionId: "ID de Transaction",
    date: "Date"
  }
};

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions, language, currency }) => {
  const t = translations[language as keyof typeof translations];

  return (
    <div>
           <div className="container2"></div>
    <div className="container2">
      </div>
      <h2 className="merchant-title">{t.recentTransactions}</h2>
      {transactions.length === 0 ? (
        <p className="merchant-subtitle">{t.noTransactions}</p>
      ) : (
        <ul className="space-y-3">
          {transactions.map((tx, index) => (
            <li key={index} className="merchant-subtitle">
              <div className="container2">
                <span className="merchant-subtitle">{t.amount}: {currency} {tx.amount.toFixed(2)}</span>
                <span className="merchant-subtitle">{new Date(tx.timestamp).toLocaleString()}</span>
              </div>
              <p className="merchant-subtitle">{t.transactionId}: {tx.txHash.substr(0, 10)}...</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TransactionHistory;