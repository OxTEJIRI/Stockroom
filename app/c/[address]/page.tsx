import { notFound } from "next/navigation";
import { isAddress } from "viem";
import Catalogue from "@/app/components/Catalogue";
import Ledger from "@/app/components/Ledger";
import { EXPLORER_ADDRESS } from "@/lib/config";
import { loadCatalog, toSheet } from "@/lib/catalog";
import { totals } from "@/lib/licenses";
import { formatPrice } from "@/lib/works";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  return { title: `Creator ${address.slice(0, 6)}…${address.slice(-4)} – Stockroom` };
}

export default async function CreatorPage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  if (!isAddress(address)) notFound();
  const { works, licenses } = await loadCatalog();
  const mine = works.filter((w) => w.payTo.toLowerCase() === address.toLowerCase());
  const sales = licenses.filter((l) => l.payTo.toLowerCase() === address.toLowerCase());
  if (mine.length === 0 && sales.length === 0) notFound();
  const names = [...new Set(mine.map((w) => w.creatorName))];
  const sum = totals(sales);

  return (
    <div className="wrap" style={{ paddingBottom: 88 }}>
      <div className="page-head">
        <h1>{names.join(" & ") || "A Stockroom creator"}</h1>
        <p>
          {mine.length} {mine.length === 1 ? "work" : "works"} in the catalogue.{" "}
          {sum.count > 0
            ? `Earned ${formatPrice(sum.paidUsd)} from ${sum.count} ${sum.count === 1 ? "licence" : "licences"}, paid straight to `
            : "Licences are paid straight to "}
          <a href={`${EXPLORER_ADDRESS}${address}`} target="_blank" rel="noreferrer" className="mono">
            {address}
          </a>
          .
        </p>
      </div>
      <Catalogue works={toSheet(mine, licenses)} filters={false} />
      <h2 className="h2" style={{ margin: "56px 0 18px" }}>Licences sold</h2>
      <Ledger licenses={sales} limit={50} />
    </div>
  );
}
