import Image from "next/image";
import ATMComponent from "../components/atm";
import Merchant from "@/components/Merchant";

export default function Home() {
  return (
    <div>
      {/* <div className="image-container "> */}
      {/* <ATMComponent /> */}
      <Merchant />
    </div>
  );
}
