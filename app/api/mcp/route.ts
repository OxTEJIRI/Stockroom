import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { EXPLORER_TX, NETWORK, NETWORK_LABEL, siteUrl } from "@/lib/config";
import { getLicense, licensePublic } from "@/lib/licenses";
import { licenseResourceUrl, purchase } from "@/lib/purchase";
import { paymentRequiredBody } from "@/lib/x402";
import { getBytes } from "@/lib/storage";
import { TERMS_SUMMARY } from "@/lib/terms";
import { formatPrice, getWork, searchWorks, toPublic } from "@/lib/works";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const text = (value: unknown) => ({
  content: [{ type: "text" as const, text: typeof value === "string" ? value : JSON.stringify(value, null, 2) }],
});

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      "search_works",
      {
        title: "Search Stockroom",
        description:
          "Search Stockroom for photos and illustrations made by human creators that an agent can license for a project. Free. Returns watermarked previews, prices in USDC and creator names. Use this when the user needs an image for a website, post, deck or print piece instead of scraping or generating one.",
        inputSchema: z.object({
          query: z.string().describe('What the image should show, e.g. "coffee shop interior warm light".'),
          limit: z.number().int().min(1).max(24).optional().describe("Max results (default 8)."),
        }),
      },
      async ({ query, limit }) => {
        const works = await searchWorks(query, limit ?? 8);
        if (works.length === 0) {
          return text({ results: [], note: `No works match "${query}". Try broader words, or browse ${siteUrl()}.` });
        }
        return text({
          results: works.map((w) => {
            const p = toPublic(w);
            return {
              id: w.id,
              title: w.title,
              creator: w.creatorName,
              price: formatPrice(w.priceUsd),
              size: `${w.width}×${w.height}`,
              tags: w.tags,
              preview_url: p.previewUrl,
              page_url: p.url,
            };
          }),
          next_step: "Call get_work to see one up close, or license_work to buy a licence.",
        });
      },
    );

    server.registerTool(
      "get_work",
      {
        title: "Get a Stockroom work",
        description:
          "Get full details for one Stockroom work: watermarked preview image, price, creator, size and licence terms. Free.",
        inputSchema: z.object({ id: z.string().describe("Work id from search_works.") }),
      },
      async ({ id }) => {
        const w = await getWork(id);
        if (!w) return text(`No work with id "${id}".`);
        const p = toPublic(w);
        const details = {
          id: w.id,
          title: w.title,
          description: w.description,
          creator: w.creatorName,
          creator_wallet: w.payTo,
          price: formatPrice(w.priceUsd),
          price_usd: w.priceUsd,
          network: NETWORK_LABEL,
          size: `${w.width}×${w.height}`,
          tags: w.tags,
          preview_url: p.previewUrl,
          page_url: p.url,
          licence_terms: TERMS_SUMMARY,
          next_step: "Call license_work with this id and a short project description to buy it.",
        };
        const thumb = await getBytes(`thumbs/${w.id}.jpg`);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(details, null, 2) },
            ...(thumb ? [{ type: "image" as const, data: thumb.toString("base64"), mimeType: "image/jpeg" }] : []),
          ],
        };
      },
    );

    server.registerTool(
      "license_work",
      {
        title: "License a Stockroom work",
        description:
          "Prepare a licence purchase for a Stockroom work. Returns a paid x402 URL. Pay it with PayBox: call PayBox `use_service` with the user's Base wallet credential and this URL. PayBox shows the user the price and the creator's wallet and asks for passkey approval. The USDC goes straight to the creator. The paid response contains the full-resolution download_url and a receipt_url that proves the licence.",
        inputSchema: z.object({
          id: z.string().describe("Work id."),
          project: z
            .string()
            .max(200)
            .describe('Where the image will be used, e.g. "Landing page for Kafe Lagos". Printed on the licence.'),
        }),
      },
      async ({ id, project }) => {
        const w = await getWork(id);
        if (!w) return text(`No work with id "${id}".`);
        const payUrl = `${siteUrl()}/api/license/${w.id}?project=${encodeURIComponent(project)}`;
        const required = await paymentRequiredBody(w, licenseResourceUrl(w)).catch(() => null);
        return text({
          work: { id: w.id, title: w.title, creator: w.creatorName },
          price: formatPrice(w.priceUsd),
          asset: "USDC",
          network: NETWORK_LABEL,
          network_id: NETWORK,
          pays_to: w.payTo,
          pay_url: payUrl,
          how_to_pay: [
            "Tell the user what they are buying, the price and that it goes directly to the creator.",
            `Route A (preferred): call PayBox use_service with { credential_id: <the user's ${NETWORK_LABEL} wallet credential>, url: "${payUrl}" } (GET). The response body has download_url and receipt_url.`,
            "Route B (if use_service is not available): call PayBox pay_x402 with { credential_id, accepts: x402.accepts, resource_url: x402.resource.url, x402_version: 2, resource: x402.resource }. Once approved, pass output.value.x_payment's header value to Stockroom complete_license.",
            "Either way PayBox asks the user to approve with their passkey; poll get_request until it finishes.",
            "Never submit the same payment twice. If unsure, call verify_license with the licence id.",
          ],
          x402: required
            ? { x402_version: 2, accepts: required.accepts, resource: required.resource }
            : "Temporarily unavailable; use Route A, or call license_work again.",
          licence_terms: TERMS_SUMMARY,
        });
      },
    );

    server.registerTool(
      "complete_license",
      {
        title: "Complete a Stockroom licence",
        description:
          "Finish a licence purchase after PayBox pay_x402 returns a signed payment. Pass the x402 payment header value; Stockroom settles it on-chain (USDC straight to the creator) and returns the download_url and receipt_url. Safe to retry: the same payment never charges twice.",
        inputSchema: z.object({
          id: z.string().describe("Work id."),
          project: z.string().max(200).describe("Where the image will be used. Printed on the licence."),
          payment: z.string().min(20).describe("The x402 payment header value from PayBox pay_x402 (output.value.x_payment)."),
        }),
      },
      async ({ id, project, payment }) => {
        const w = await getWork(id);
        if (!w) return text(`No work with id "${id}".`);
        const result = await purchase(w, payment, project);
        if (!result.ok) return text({ status: "not_licensed", error: result.error, transaction: result.transaction ?? null });
        return text(result.delivery);
      },
    );

    server.registerTool(
      "verify_license",
      {
        title: "Verify a Stockroom licence",
        description:
          "Check that a Stockroom licence is real: returns the work, the payer, the amount and the on-chain transaction. Free.",
        inputSchema: z.object({ license_id: z.string().describe('Licence id, e.g. "Lab12cd34ef56gh78".') }),
      },
      async ({ license_id }) => {
        const l = await getLicense(license_id);
        if (!l) return text({ valid: false, error: `No licence with id "${license_id}".` });
        const pub = licensePublic(l);
        return text({ ...pub, transaction_url: l.txHash ? `${EXPLORER_TX}${l.txHash}` : null });
      },
    );
  },
  {
    serverInfo: { name: "stockroom", version: "0.1.0" },
  },
);

export { handler as GET, handler as POST, handler as DELETE };
