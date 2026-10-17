import { HTTPFacilitatorClient, x402ResourceServer } from "@x402/core/server";
import {
  decodePaymentSignatureHeader,
  encodePaymentRequiredHeader,
  encodePaymentResponseHeader,
} from "@x402/core/http";
import type { PaymentPayload, SettleResponse } from "@x402/core/types";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { FACILITATOR_URL, NETWORK } from "./config";
import type { Work } from "./works";

let serverPromise: Promise<x402ResourceServer> | null = null;

function getServer() {
  if (!serverPromise) {
    serverPromise = (async () => {
      const server = new x402ResourceServer(new HTTPFacilitatorClient({ url: FACILITATOR_URL })).register(
        "eip155:*",
        new ExactEvmScheme(),
      );
      await server.initialize();
      return server;
    })().catch((err) => {
      serverPromise = null;
      throw err;
    });
  }
  return serverPromise;
}

async function requirementsFor(work: Work) {
  const server = await getServer();
  // Each work pays its own creator: payTo is per item, so Stockroom never holds funds.
  return server.buildPaymentRequirements({
    scheme: "exact",
    network: NETWORK,
    payTo: work.payTo,
    price: `$${work.priceUsd.toFixed(2)}`,
    maxTimeoutSeconds: 300,
  });
}

export async function paymentRequiredResponse(work: Work, resourceUrl: string, error?: string) {
  const server = await getServer();
  const requirements = await requirementsFor(work);
  const body = await server.createPaymentRequiredResponse(
    requirements,
    {
      url: resourceUrl,
      description: `Stockroom licence: "${work.title}" by ${work.creatorName}. Paid directly to the creator.`,
      mimeType: "application/json",
      serviceName: "Stockroom",
    },
    error,
  );
  return new Response(JSON.stringify(body), {
    status: 402,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      "PAYMENT-REQUIRED": encodePaymentRequiredHeader(body),
    },
  });
}

export function readPaymentHeader(req: Request) {
  return req.headers.get("payment-signature") || req.headers.get("x-payment");
}

export function decodePayment(header: string): PaymentPayload | null {
  try {
    return decodePaymentSignatureHeader(header);
  } catch {
    return null;
  }
}

export function nonceOf(payload: PaymentPayload): string {
  const auth = (payload.payload as { authorization?: { nonce?: string; from?: string } }).authorization;
  return typeof auth?.nonce === "string" ? auth.nonce : "";
}

function payerOf(payload: PaymentPayload): string {
  const auth = (payload.payload as { authorization?: { from?: string } }).authorization;
  return typeof auth?.from === "string" ? auth.from : "";
}

function friendly(message: string) {
  if (/exceeds balance|insufficient/i.test(message)) return "Not enough USDC in the paying wallet. Nothing was charged.";
  if (/expired|validBefore|valid_before/i.test(message)) return "The payment authorisation expired. Nothing was charged; try again.";
  if (/nonce|already used|authorization is used/i.test(message)) return "This payment was already used.";
  return message.split("\n")[0].slice(0, 200);
}

export type SettleOutcome =
  | { ok: true; payer: string; transaction: string; nonce: string; settle: SettleResponse }
  | { ok: false; error: string };

export async function verifyAndSettle(work: Work, payload: PaymentPayload): Promise<SettleOutcome> {
  const server = await getServer();
  const requirements = await requirementsFor(work);
  const match = server.findMatchingRequirements(requirements, payload);
  if (!match) return { ok: false, error: "Payment does not match this item's price, network or recipient." };

  const verified = await server.verifyPayment(payload, match);
  if (!verified.isValid) {
    return { ok: false, error: friendly(verified.invalidMessage || verified.invalidReason || "Payment could not be verified.") };
  }
  const settled = await server.settlePayment(payload, match);
  if (!settled.success) {
    return { ok: false, error: friendly(settled.errorMessage || settled.errorReason || "Payment could not be settled.") };
  }
  return {
    ok: true,
    payer: settled.payer || verified.payer || payerOf(payload),
    transaction: settled.transaction,
    nonce: nonceOf(payload),
    settle: settled,
  };
}

export { encodePaymentResponseHeader };
