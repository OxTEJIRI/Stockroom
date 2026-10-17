import { NETWORK_LABEL, siteUrl } from "@/lib/config";
import { TERMS_SUMMARY } from "@/lib/terms";

export const dynamic = "force-dynamic";

export function GET() {
  const base = siteUrl();
  const body = `# Stockroom

> Stock media for AI agents. Photos and illustrations by human creators, licensed per use and paid in USDC on ${NETWORK_LABEL} straight to the creator. A PayBox plugin; every payment is an x402 transaction and doubles as the licence.

## Use it
- MCP server: ${base}/api/mcp (tools: search_works, get_work, license_work, verify_license)
- Catalogue JSON: ${base}/api/works?q=<query>
- Licence purchase (x402): GET ${base}/api/license/<work id>?project=<where it will be used>
- Verify a licence: ${base}/api/licenses/<licence id>

## Paying with PayBox
Call license_work, then PayBox use_service with the user's ${NETWORK_LABEL} wallet credential and the returned pay URL. The user approves with a passkey. The response has download_url and receipt_url. Do not submit the same payment twice.

## Licence
${TERMS_SUMMARY}
`;
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
