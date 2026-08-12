import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flare Terminal",
  description: "Flare Terminal is a Bloomberg-style trading interface for Flare Network",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <div className="crt-vignette" />
        <div className="crt-overlay" />
      </body>
    </html>
  );
}
