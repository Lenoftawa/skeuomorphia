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
      <h2 className="text-xl font-semibold mb-4">{t.recentTransactions}</h2>
      {transactions.length === 0 ? (
        <p className="text-sm text-gray-500">{t.noTransactions}</p>
      ) : (
        <ul className="space-y-3">
          {transactions.map((tx, index) => (
            <li key={index} className="bg-gray-50 p-3 rounded-md shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900">{t.amount}: {currency} {tx.amount.toFixed(2)}</span>
                <span className="text-xs text-gray-500">{new Date(tx.timestamp).toLocaleString()}</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">{t.transactionId}: {tx.txHash.substr(0, 10)}...</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TransactionHistory;