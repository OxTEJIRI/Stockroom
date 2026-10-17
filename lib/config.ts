export const NETWORK = (process.env.X402_NETWORK || "eip155:8453") as `${string}:${string}`;
export const FACILITATOR_URL = process.env.X402_FACILITATOR_URL || "https://facilitator.payai.network";

export const NETWORK_LABEL = NETWORK === "eip155:84532" ? "Base Sepolia" : "Base";
export const EXPLORER_TX = NETWORK === "eip155:84532" ? "https://sepolia.basescan.org/tx/" : "https://basescan.org/tx/";
export const EXPLORER_ADDRESS =
  NETWORK === "eip155:84532" ? "https://sepolia.basescan.org/address/" : "https://basescan.org/address/";

// Public origin used in every link handed to agents (pay, download, receipt, previews).
// VERCEL_PROJECT_PRODUCTION_URL can point at a removed auto-assigned domain, so production pins the real one.
const PRODUCTION_ORIGIN = "https://stockroom-plugin.vercel.app";

export function siteUrl(): string {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_ENV === "production") return PRODUCTION_ORIGIN;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // Vercel functions accept ~4.5 MB request bodies
export const MIN_PRICE = 0.01;
export const MAX_PRICE = 100;
