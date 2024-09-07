import React from "react";
import Link from "next/link";

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <h1 className="text-4xl font-bold mb-6">Welcome to Web3 ATM</h1>
        <p className="text-xl mb-8">Choose your role:</p>
        <div className="flex justify-center space-x-4">
          <Link
            href="/atm"
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-300"
          >
            Payer (ATM User)
          </Link>
          <Link
            href="/redeem"
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition duration-300"
          >
            Payee (Merchant)
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
