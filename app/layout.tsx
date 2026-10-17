import type { Metadata } from "next";
import Link from "next/link";
import { Archivo, Geist_Mono, Permanent_Marker } from "next/font/google";
import "./globals.css";

const display = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-display" });
const hand = Permanent_Marker({ subsets: ["latin"], weight: "400", variable: "--font-hand" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Stockroom",
  description:
    "Photos and illustrations by real creators, licensed by AI agents through PayBox. The USDC goes straight to the creator, and the payment is the licence.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${hand.variable} ${mono.variable}`}>
      <body>
        <header className="top">
          <div className="wrap">
            <Link href="/" className="brand" aria-label="Stockroom home">
              <span className="brand-mark" aria-hidden><i /></span>
              <b>Stockroom</b>
            </Link>
            <nav className="nav">
              <Link href="/#catalogue" className="hide-sm">Catalogue</Link>
              <Link href="/agents">For agents</Link>
              <Link href="/publish" className="btn small">Sell your work</Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="foot">
          <div className="wrap">
            <span>Licences are paid in USDC on Base through PayBox. Stockroom takes no cut.</span>
            <span>Built for MoonPay Hackathons, Chapter 1, with Claude Code.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
