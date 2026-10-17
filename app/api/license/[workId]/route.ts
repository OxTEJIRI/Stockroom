import { licenseResourceUrl, purchase } from "@/lib/purchase";
import { getWork } from "@/lib/works";
import { encodePaymentResponseHeader, paymentRequiredResponse, readPaymentHeader } from "@/lib/x402";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function handle(req: Request, { params }: { params: Promise<{ workId: string }> }) {
  const { workId } = await params;
  const work = await getWork(workId);
  if (!work) return Response.json({ error: "Work not found" }, { status: 404 });

  const project = new URL(req.url).searchParams.get("project") || "";
  const resourceUrl = licenseResourceUrl(work);

  const header = readPaymentHeader(req);
  if (!header) return paymentRequiredResponse(work, resourceUrl);

  const result = await purchase(work, header, project);
  if (!result.ok) {
    if (result.status === 500) return Response.json({ error: result.error, transaction: result.transaction }, { status: 500 });
    return paymentRequiredResponse(work, resourceUrl, result.error);
  }
  const headers: Record<string, string> = { "content-type": "application/json", "cache-control": "no-store" };
  if (result.settle) headers["PAYMENT-RESPONSE"] = encodePaymentResponseHeader(result.settle);
  return new Response(JSON.stringify(result.delivery), { status: 200, headers });
}

export { handle as GET, handle as POST };
