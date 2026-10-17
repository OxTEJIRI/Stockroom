import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-serif" });
const sans = Geist({ subsets: ["latin"], variable: "--font-sans" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Stockroom",
  description:
    "Stock media for AI agents. Creators list their work, agents license it through PayBox, and the USDC goes straight to the creator.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        <header className="top">
          <div className="wrap">
            <Link href="/" className="brand">
              <b>Stockroom</b>
              <span>stock media for agents</span>
            </Link>
            <nav className="nav">
              <Link href="/#catalogue" className="hide-sm">Catalogue</Link>
              <Link href="/agents">For agents</Link>
              <Link href="/publish" className="btn">Sell your work</Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="foot">
          <div className="wrap">
            <span>Paid with PayBox over x402 · USDC on Base · 0% platform fee</span>
            <span>Built for MoonPay Hackathons, Chapter 1 · Built with Claude Code</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
