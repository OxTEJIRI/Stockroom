import type { SettleResponse } from "@x402/core/types";
import { siteUrl } from "./config";
import { createLicense, findLicenseByNonce, licenseDelivery } from "./licenses";
import type { Work } from "./works";
import { decodePayment, nonceOf, verifyAndSettle } from "./x402";

export type PurchaseResult =
  | { ok: true; delivery: ReturnType<typeof licenseDelivery>; settle?: SettleResponse }
  | { ok: false; status: 402 | 500; error: string; transaction?: string };

export function licenseResourceUrl(work: Work) {
  return `${siteUrl()}/api/license/${work.id}`;
}

/** Verify + settle a signed x402 payment for a work and issue the licence. Shared by the HTTP route and MCP. */
export async function purchase(work: Work, paymentHeader: string, project: string): Promise<PurchaseResult> {
  const payload = decodePayment(paymentHeader.trim());
  if (!payload) return { ok: false, status: 402, error: "Malformed payment header." };

  // Same signed payment sent twice: hand back the existing licence, never charge again.
  const nonce = nonceOf(payload);
  if (nonce) {
    const existing = await findLicenseByNonce(nonce);
    if (existing && existing.workId === work.id) return { ok: true, delivery: licenseDelivery(existing) };
  }

  let outcome;
  try {
    outcome = await verifyAndSettle(work, payload);
  } catch (err) {
    console.error("settle error", err);
    return { ok: false, status: 402, error: "Payment service unavailable, nothing was charged. Try again." };
  }
  if (!outcome.ok) return { ok: false, status: 402, error: outcome.error };

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const license = await createLicense({
        work,
        payer: outcome.payer,
        txHash: outcome.transaction,
        nonce: outcome.nonce,
        project: project.trim().slice(0, 200),
      });
      return { ok: true, delivery: licenseDelivery(license), settle: outcome.settle };
    } catch (err) {
      console.error("licence write failed", attempt, err);
    }
  }
  return {
    ok: false,
    status: 500,
    error: "Payment settled but the licence could not be saved. Contact support with this transaction.",
    transaction: outcome.transaction,
  };
}
