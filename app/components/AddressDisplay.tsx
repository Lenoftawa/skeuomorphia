import React from "react";
import { Copy } from "lucide-react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface AddressDisplayProps {
  address: string;
  balances: {
    ETH: string;
    USDC: string;
    EURC: string;
    NZDT: string;
  };
  currentToken: string;
  onTokenChange: (token: string) => void;
}

const AddressDisplay: React.FC<AddressDisplayProps> = ({
  address,
  balances,
  currentToken,
  onTokenChange,
}) => {
  const tokens = ["ETH", "USDC", "EURC", "NZDT"];

  const cycleToken = (direction: "next" | "prev") => {
    const currentIndex = tokens.indexOf(currentToken);
    const newIndex =
      direction === "next"
        ? (currentIndex + 1) % tokens.length
        : (currentIndex - 1 + tokens.length) % tokens.length;
    onTokenChange(tokens[newIndex]);
  };

  const formatBalance = (balance: string) => {
    const [amount, symbol] = balance.split(" ");
    const num = parseFloat(amount);
    return `${num.toFixed(symbol === "ETH" ? 5 : 2)} ${symbol}`;
  };

  const copyAddressToClipboard = () => {
    navigator.clipboard.writeText(address).then(() => {
      alert("Address copied to clipboard!");
    });
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontSize: "20px",
      }}
    >
      <span>
        {address}{" "}
        <Copy
          size={24}
          onClick={copyAddressToClipboard}
          style={{ marginLeft: "5px", cursor: "pointer" }}
        />
      </span>
      {/* <div style={{ display: "flex", alignItems: "center", marginTop: "5px" }}>
        <ChevronLeft
          onClick={() => cycleToken("prev")}
          style={{ cursor: "pointer" }}
        />
        <span style={{ margin: "0 10px" }}>
          {formatBalance(balances[currentToken as keyof typeof balances])}
        </span>
        <ChevronRight
          onClick={() => cycleToken("next")}
          style={{ cursor: "pointer" }}
        />
      </div> */}
    </div>
  );
};

export default AddressDisplay;
