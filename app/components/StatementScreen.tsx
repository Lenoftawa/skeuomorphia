import React from 'react';

interface MintInfo {
  id: number;
  denomination: number;
  tokenSymbol: string;
  txHash: string;
  timestamp: number;
}

interface StatementScreenProps {
  mintHistory: MintInfo[];
  currentPage: number;
}

const StatementScreen: React.FC<StatementScreenProps> = ({ mintHistory, currentPage }) => {
  const itemsPerPage = 10;
  const totalPages = Math.ceil(mintHistory.length / itemsPerPage);

  const getCurrentPageItems = () => {
    const start = currentPage * itemsPerPage;
    const end = start + itemsPerPage;
    return mintHistory.slice(start, end);
  };

  return (
    <div className="statement-screen">
      <div className="mint-list">
        {getCurrentPageItems().map((mint, index) => (
          <div key={index} className="mint-item">
            <div className="mint-info">
              <span className="mint-id">ID: {mint.id}</span>
              <span className="mint-amount">{mint.denomination} {mint.tokenSymbol}</span>
            </div>
            <div className="mint-details">
              <span className="mint-tx">Tx: {mint.txHash.slice(0, 10)}...</span>
              <span className="mint-time">{new Date(mint.timestamp).toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="navigation">
        <span className="page-info">Page {currentPage + 1} of {totalPages}</span>
      </div>

      <style jsx>{`
        .statement-screen {
          font-family: "EnterCommand", monospace;
          color: var(--secondary-color);
          padding: 20px;
        }
        .mint-list {
          margin-bottom: 20px;
        }
        .mint-item {
          border: 2px solid var(--secondary-color);
          margin-bottom: 10px;
          padding: 10px;
          background-color: var(--bg-color-1);
        }
        .mint-info, .mint-details {
          display: flex;
          justify-content: space-between;
        }
        .mint-details {
          font-size: 0.8em;
          margin-top: 5px;
        }
        .navigation {
          text-align: center;
        }
        .page-info {
          font-size: 0.9em;
        }
      `}</style>
    </div>
  );
};

export default StatementScreen;