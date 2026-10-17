import Link from "next/link";
import { notFound } from "next/navigation";
import { EXPLORER_ADDRESS, EXPLORER_TX } from "@/lib/config";
import { getLicense } from "@/lib/licenses";
import { TERMS_FULL } from "@/lib/terms";
import { formatPrice, getWork } from "@/lib/works";

export const dynamic = "force-dynamic";

export const metadata = { title: "Licence receipt · Stockroom" };

const short = (a: string) => (a ? `${a.slice(0, 8)}…${a.slice(-6)}` : "—");

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const l = await getLicense(id);
  if (!l) notFound();
  const w = await getWork(l.workId);
  const date = new Date(l.createdAt).toUTCString().replace(" GMT", " UTC");

  return (
    <div className="wrap receipt-wrap">
      <article className="receipt">
        <div className="inner">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <span className="eyebrow">Stockroom licence · {l.termsVersion}</span>
            <span className="valid">Valid</span>
          </div>
          <h1>Licence {l.id}</h1>
          <div className="muted mono" style={{ fontSize: 13 }}>{date}</div>

          <div className="work-row">
            {w ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/media/thumb/${w.id}`} alt={l.workTitle} style={{ width: 96, height: 96, objectFit: "cover" }} />
            ) : (
              <div style={{ width: 96, height: 96, background: "var(--paper-2)" }} />
            )}
            <div>
              <div style={{ fontFamily: "var(--serif)", fontSize: 26, lineHeight: 1.1 }}>
                {w ? <Link href={`/w/${w.id}`}>{l.workTitle}</Link> : l.workTitle}
              </div>
              <div className="muted">by {l.creatorName}</div>
            </div>
          </div>

          <div className="kv">
            <div className="row"><span>Licensed to</span><span><a href={`${EXPLORER_ADDRESS}${l.payer}`} target="_blank" rel="noreferrer">{l.payer || "—"}</a></span></div>
            <div className="row"><span>Project</span><span>{l.project || "—"}</span></div>
            <div className="row"><span>Amount</span><span>{formatPrice(l.amountUsd)} USDC</span></div>
            <div className="row"><span>Paid to creator</span><span><a href={`${EXPLORER_ADDRESS}${l.payTo}`} target="_blank" rel="noreferrer">{l.payTo}</a></span></div>
            <div className="row"><span>Network</span><span>{l.network === "eip155:8453" ? "Base" : l.network === "eip155:84532" ? "Base Sepolia" : l.network} · USDC</span></div>
            <div className="row">
              <span>Transaction</span>
              <span>
                {l.txHash ? (
                  <a href={`${EXPLORER_TX}${l.txHash}`} target="_blank" rel="noreferrer">{short(l.txHash)} ↗</a>
                ) : (
                  "—"
                )}
              </span>
            </div>
          </div>

          <div className="eyebrow" style={{ margin: "26px 0 8px" }}>Terms</div>
          <ul className="terms">
            {TERMS_FULL.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span className="stamp">Paid on-chain · licence granted</span>
            <span className="muted mono" style={{ fontSize: 12 }}>Verify: /api/licenses/{l.id}</span>
          </div>
        </div>
      </article>
    </div>
  );
}
