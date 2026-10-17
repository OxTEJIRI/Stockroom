# Stockroom

**Stock media for AI agents.** Creators list photos and illustrations. Agents license them through
[PayBox](https://paybox.sh). The USDC goes straight to the creator's wallet, and the payment itself is
the licence.

Built for **MoonPay Hackathons, Chapter 1** (PayBox plugin), Creative track.

## Why

Agents now build websites, decks and posts, and every one needs images. Today they scrape them or
generate them, and the people who made the work get nothing. Stockroom gives agents a legal,
paid way to use a real creator's work, with one passkey approval.

## How it works

1. **A creator lists a work.** They upload an image, set a price and paste a Base wallet. Stockroom
   keeps the original private and shows a watermarked preview.
2. **An agent licenses it.** It calls `license_work`, then PayBox `use_service` on the returned URL.
   Stockroom answers `402 Payment Required` (x402 v2), with the **creator's wallet as `payTo`**.
   PayBox shows the user the price and asks for a passkey.
3. **The payment is the licence.** Stockroom verifies and settles the EIP-3009 USDC transfer
   through an x402 facilitator, then returns the full-resolution download link and a receipt
   tied to the Base transaction.

Stockroom never holds funds (0% fee, non-custodial). Sending the same signed payment twice
returns the same licence, so the user is never charged twice.

## Plugin (MCP)

Remote MCP server: `https://<your-domain>/api/mcp`

| Tool | What it does | Cost |
|---|---|---|
| `search_works` | Find works by what they show | free |
| `get_work` | Preview image, price, creator, licence terms | free |
| `license_work` | Returns the paid x402 URL to settle through PayBox | paid |
| `verify_license` | Confirms a licence and its on-chain payment | free |

Also: `GET /api/works?q=`, `GET /api/license/<id>` (x402), `GET /api/licenses/<id>`, `/llms.txt`.

## Run locally

```bash
npm install
npm run dev
```

Without `BLOB_READ_WRITE_TOKEN`, files are stored in `.data/` (dev only). See `.env.example`.

Test a payment with a raw x402 client: `node scripts/x402-probe.mjs <licence url>`. Without
`PRIVATE_KEY` it signs from an empty wallet, and the facilitator rejects it for lack of funds.

## Deploy (Vercel)

1. Import the repo in Vercel.
2. In Storage, create a **Blob** store (private) and connect it to the project. That sets `BLOB_READ_WRITE_TOKEN`.
3. Optionally set `ADMIN_KEY` (takedowns) and `PUBLISH_CODE` (invite-only publishing).

## Stack

Next.js 16 · Vercel Blob · sharp · `@x402/core` + `@x402/evm` (PayAI facilitator, Base mainnet USDC)
· `mcp-handler`.

## Disclosure

Built by the participant, with Claude Code as a coding assistant. The participant chose the idea,
scope, pricing, licence terms and catalogue, and recorded the demo.
