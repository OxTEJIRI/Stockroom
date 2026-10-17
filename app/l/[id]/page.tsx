import Link from "next/link";
import { notFound } from "next/navigation";
import { EXPLORER_ADDRESS, EXPLORER_TX } from "@/lib/config";
import { getLicense } from "@/lib/licenses";
import { TERMS_FULL } from "@/lib/terms";
import { formatPrice, getWork } from "@/lib/works";

export const dynamic = "force-dynamic";

export const metadata = { title: "Licence – Stockroom" };

const NETWORKS: Record<string, string> = { "eip155:8453": "Base", "eip155:84532": "Base Sepolia" };

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const l = await getLicense(id);
  if (!l) notFound();
  const w = await getWork(l.workId);
  const date = new Date(l.createdAt).toLocaleString("en-GB", { dateStyle: "long", timeStyle: "short", timeZone: "UTC" });

  return (
    <div className="wrap receipt-wrap">
      <article className="receipt">
        <div className="head">
          <div>
            <h1>Licence {l.id}</h1>
            <div className="when">Issued {date} UTC</div>
            <div style={{ marginTop: 10 }}><span className="valid">Valid, paid on-chain</span></div>
          </div>
          <div className="stampmark" aria-hidden>
            Licensed
            <svg viewBox="0 0 160 60" preserveAspectRatio="none">
              <path d="M84 4 C 140 2, 158 18, 156 32 C 154 48, 120 58, 78 57 C 36 56, 3 46, 4 30 C 5 14, 40 3, 90 6 C 104 7, 116 10, 124 14" />
            </svg>
          </div>
        </div>

        <div className="item">
          {w ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/media/thumb/${w.id}`} alt={l.workTitle} />
          ) : (
            <div style={{ width: 120, aspectRatio: "3 / 2", background: "var(--glass)", borderRadius: 4 }} />
          )}
          <div>
            <div className="t">{w ? <Link href={`/w/${w.id}`}>{l.workTitle}</Link> : l.workTitle}</div>
            <div style={{ color: "var(--slate)" }}>By {l.creatorName}</div>
          </div>
        </div>

        <div className="facts">
          <div className="row"><span>Licensed to</span><a className="addr" href={`${EXPLORER_ADDRESS}${l.payer}`} target="_blank" rel="noreferrer">{l.payer || "Unknown"}</a></div>
          <div className="row"><span>For the project</span><span>{l.project || "Not specified"}</span></div>
          <div className="row"><span>Amount</span><span>{formatPrice(l.amountUsd)} USDC on {NETWORKS[l.network] ?? l.network}</span></div>
          <div className="row"><span>Paid to the creator</span><a className="addr" href={`${EXPLORER_ADDRESS}${l.payTo}`} target="_blank" rel="noreferrer">{l.payTo}</a></div>
          <div className="row">
            <span>Transaction</span>
            {l.txHash ? (
              <a className="addr" href={`${EXPLORER_TX}${l.txHash}`} target="_blank" rel="noreferrer">{l.txHash}</a>
            ) : (
              <span>Not recorded</span>
            )}
          </div>
        </div>

        <h2 className="h3" style={{ marginTop: 26 }}>What this licence allows</h2>
        <ul className="terms-list">
          {TERMS_FULL.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <p className="hint" style={{ marginTop: 20 }}>
          Anyone can check this licence at <span className="mono">/api/licenses/{l.id}</span>, or by asking an agent to run{" "}
          <span className="mono">verify_license</span>.
        </p>
      </article>
    </div>
  );
}
