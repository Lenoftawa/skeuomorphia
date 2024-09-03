import Image from "next/image";
import ATMComponent from "../components/atm";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <ATMComponent />
    </main>
  );
}
