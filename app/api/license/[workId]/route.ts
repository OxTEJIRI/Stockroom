import { siteUrl } from "@/lib/config";
import { createLicense, findLicenseByNonce, licenseDelivery } from "@/lib/licenses";
import { getWork } from "@/lib/works";
import {
  decodePayment,
  encodePaymentResponseHeader,
  nonceOf,
  paymentRequiredResponse,
  readPaymentHeader,
  verifyAndSettle,
} from "@/lib/x402";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function handle(req: Request, { params }: { params: Promise<{ workId: string }> }) {
  const { workId } = await params;
  const work = await getWork(workId);
  if (!work) return Response.json({ error: "Work not found" }, { status: 404 });

  const project = (new URL(req.url).searchParams.get("project") || "").trim().slice(0, 200);
  const resourceUrl = `${siteUrl()}/api/license/${work.id}`;

  const header = readPaymentHeader(req);
  if (!header) return paymentRequiredResponse(work, resourceUrl);

  const payload = decodePayment(header);
  if (!payload) return paymentRequiredResponse(work, resourceUrl, "Malformed payment header.");

  // Same signed payment sent twice: hand back the existing licence, never charge again.
  const nonce = nonceOf(payload);
  if (nonce) {
    const existing = await findLicenseByNonce(nonce);
    if (existing && existing.workId === work.id) return Response.json(licenseDelivery(existing));
  }

  let outcome;
  try {
    outcome = await verifyAndSettle(work, payload);
  } catch (err) {
    console.error("settle error", err);
    return paymentRequiredResponse(work, resourceUrl, "Payment service unavailable, nothing was charged. Try again.");
  }
  if (!outcome.ok) return paymentRequiredResponse(work, resourceUrl, outcome.error);

  let license;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      license = await createLicense({
        work,
        payer: outcome.payer,
        txHash: outcome.transaction,
        nonce: outcome.nonce,
        project,
      });
      break;
    } catch (err) {
      console.error("licence write failed", attempt, err);
    }
  }
  if (!license) {
    return Response.json(
      { error: "Payment settled but the licence could not be saved. Contact support with this transaction.", transaction: outcome.transaction },
      { status: 500 },
    );
  }

  return new Response(JSON.stringify(licenseDelivery(license)), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      "PAYMENT-RESPONSE": encodePaymentResponseHeader(outcome.settle),
    },
  });
}

export { handle as GET, handle as POST };
