import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Terminal, CreditCard, ShoppingBag } from "lucide-react";

const LandingPage = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <>
      <div className="landing-background">
        <div className="retro-container">
          <div className="retro-screen">
            <div className="retro-screen-content">
              <h1 className="retro-title glitch-text">Skeuomorphia Bank</h1>
              {/* <img
                src="/skeuomorphia.png"
                alt="CyberBank Logo"
                className="retro-logo"
                width={200}
                height={100}
              /> */}
              <Terminal className="retro-icon" />
              <p className="retro-text typewriter-text">
                Select Your Operation:
              </p>
              <div className="retro-button-container">
                <Link href="/atm" className="retro-button">
                  <CreditCard className="retro-button-icon" />
                  ATM User
                </Link>
                <Link href="/redeem" className="retro-button">
                  <ShoppingBag className="retro-button-icon" />
                  Redeem
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="scan-line"></div>
      </div>
    </>
  );
};

export default LandingPage;
