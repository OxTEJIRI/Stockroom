# Stockroom — design plan

> Stock media for AI agents. Creators list their work, agents license it through PayBox,
> and the USDC goes straight to the creator's wallet. Every payment is a licence.

Entry for MoonPay Hackathons, Chapter 1 (PayBox plugin). Track: **Creative**.
Deadline: Sat 17 Oct 2026, 8pm EDT (01:00 Sun, UTC+1).

---

## 1. Problem

Agents now build sites, decks and posts, and each one needs images or copy. Today they
scrape the media or generate it, and the people who made the work get nothing. No PayBox
plugin, and no other hackathon entry, gives an agent a legal, paid way to use a real
creator's work.

## 2. Users and flows

**Creator** (web, about 30 seconds, no account)
1. Opens `/publish` and uploads an image (JPG/PNG/WebP, 10 MB max).
2. Enters a title, tags, a price in USDC and a Base wallet address (`payTo`).
3. Stockroom stores the original privately and makes a watermarked preview.

**Agent** (Claude / ChatGPT / Grok with PayBox connected)
1. `search_works("coffee shop hero photo")`. Free: returns previews and prices.
2. `get_work(id)`. Free: returns the preview, creator, price and licence terms.
3. `license_work(id, project)` returns a paid URL. The agent calls PayBox
   `use_service(credential_id, url)`, PayBox opens the approval window, and the
   user approves with a passkey.
4. The paid response returns `license_id`, `download_url` and `receipt_url`.
5. `verify_license(id)` lets anyone confirm the licence on-chain.

**Anyone** can open `/l/{id}` to see the licence receipt with its Basescan transaction.

## 3. Payment design (x402, non-custodial)

- `GET /api/license/{workId}?project=...` with no payment returns **402** with requirements:
  `exact` scheme, USDC on Base (`0x8335…2913`), `amount = price`, and **`payTo` = the
  creator's wallet**. Each item has its own payTo, so Stockroom never holds funds.
- PayBox signs an EIP-3009 authorization and retries with the payment header.
  Stockroom **verifies and settles** through the PayAI facilitator, which needs no API key
  and pays the gas.
- On success: write the licence and return JSON (not the binary), because PayBox
  `use_service` stores the response body.
- **No double charge:** licences are keyed by the payment's nonce. A replay of a settled
  payment returns the existing licence instead of charging again.
- x402 v2 (`@x402/core` 2.28) by default. PayBox also supports v1, so we fall back to it
  if `use_service` has trouble with v2.

## 4. Plugin (MCP tools)

Remote MCP server at `/api/mcp` (streamable HTTP, `mcp-handler`). The tools are thin
wrappers over the HTTP API, so the same code can be wrapped as a PayBox sandbox
artifact if the submission workspace asks for one.

| Tool | Input | Returns | Paid |
|---|---|---|---|
| `search_works` | `query`, `limit?` | id, title, creator, price, preview_url | no |
| `get_work` | `id` | full details, licence terms, preview | no |
| `license_work` | `id`, `project` | `pay_url`, price, network, payTo, and the next step: "call PayBox `use_service` with this URL" | via PayBox |
| `verify_license` | `license_id` | work, payer, amount, tx hash, valid yes/no | no |
| *(stretch)* `publish_work` | image URL, title, price, payTo | new work id | no |

## 5. Data (Vercel Blob only, no database)

- `works/{id}.json`: id, title, description, tags, priceUsd, payTo, creatorName, width,
  height, previewUrl, originalPath, createdAt
- `previews/{id}.jpg`: public. 1200 px long edge, tiled "STOCKROOM · PREVIEW" watermark (sharp)
- `originals/{id}-{random}.{ext}`: an unguessable path, only streamed through `/api/download`
- `licenses/{id}.json`: id, workId, payer, payTo, amount, network, txHash, nonce,
  project, termsVersion, downloadToken, createdAt

Search loads the small catalogue and matches title, tags and description in memory.

## 6. Pages

- `/`: pitch, catalogue grid, "how it works", and "connect your agent" (MCP URL)
- `/w/{id}`: preview, price, creator, licence terms, how to license with an agent
- `/publish`: creator upload form
- `/l/{id}`: licence receipt (work, licensee wallet, amount, Basescan link, terms)

Look: an editorial archive. Warm off-white, ink-black type, one accent colour, dark mode.

## 7. Stack

Next.js 16 (App Router) on Vercel · `@vercel/blob` · `sharp` · `@x402/core` + `@x402/evm`
· `mcp-handler` + `@modelcontextprotocol/sdk` · TypeScript. Deploy: GitHub → Vercel.

## 8. Scope

- **Must ship:** upload with previews, paid licence flow, receipts, the 4 MCP tools, the 4 pages, deploy.
- **Stretch:** `publish_work` tool, text/article listings, `llms.txt` for agent discovery.
- **Cut:** audio, creator accounts, platform fee, multi-chain.

## 9. Abuse and safety

- Image types only, 10 MB cap, simple per-IP rate limit on `/publish`.
- An optional `PUBLISH_CODE` env var makes publishing invite-only if spam appears during judging.
- Takedown: an admin delete route protected by `ADMIN_KEY`.
- The licence text is a plain template and says it is not legal advice.

## 10. Demo (≈90 s, recorded by the user)

1. Hook: "Agents are about to buy more content than people. Right now they take it for free."
2. Creator publishes one of their own photos at $0.25.
3. In Claude: "Find a hero photo for a Lagos coffee shop site and license it." Search,
   preview, PayBox approval, passkey, paid.
4. Full image plus receipt, then Basescan shows the creator wallet received the USDC.
5. Close: "Every payment is a licence. Every creator gets paid directly."

## 11. Timeline (local time, UTC+1)

| Time | Work |
|---|---|
| 16:30–17:15 | Scaffold, Blob storage, upload and previews |
| 17:15–18:30 | x402 licence route and receipts; test a real $0.01 payment |
| 18:30–19:30 | MCP tools and site pages |
| 19:30–20:30 | Deploy; end-to-end test through PayBox in Claude |
| 20:30–21:30 | Register in the submission workspace; buffer for format surprises |
| 21:30–23:30 | Record and edit the demo, post on X |
| 23:30–00:30 | Submit; buffer before the 01:00 deadline |

## 12. Owner decisions (the participant's calls)

- [ ] Name: **Stockroom**, or something else?
- [ ] Licence terms: one standard licence covering one project, worldwide, non-exclusive,
      no resale of the file. Add **"no AI-model training"**?
- [ ] Demo price: $0.25?
- [ ] Publishing: open to everyone, or invite code during judging?
- [ ] Seed catalogue: 5–10 of your own photos or designs.

## 13. Disclosure

Built by the participant with Claude Code as a coding assistant. The participant chose
the idea, scope, pricing, licence terms and catalogue, and recorded the demo.
