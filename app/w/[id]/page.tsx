import Link from "next/link";
import { notFound } from "next/navigation";
import { EXPLORER_ADDRESS, NETWORK_LABEL, siteUrl } from "@/lib/config";
import { TERMS_FULL } from "@/lib/terms";
import { formatPrice, getWork } from "@/lib/works";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const w = await getWork(id);
  return { title: w ? `${w.title} · Stockroom` : "Stockroom" };
}

export default async function WorkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const w = await getWork(id);
  if (!w) notFound();
  const short = `${w.payTo.slice(0, 6)}…${w.payTo.slice(-4)}`;

  return (
    <div className="wrap work">
      <div className="frame">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/media/preview/${w.id}`} alt={w.title} width={w.width} height={w.height} />
      </div>
      <div>
        <div className="eyebrow">Work {w.id}</div>
        <h1>{w.title}</h1>
        <div className="muted">
          by {w.creatorName} ·{" "}
          <a href={`${EXPLORER_ADDRESS}${w.payTo}`} target="_blank" rel="noreferrer" className="mono">
            {short}
          </a>
        </div>
        {w.description && <p style={{ color: "var(--ink-2)" }}>{w.description}</p>}
        {w.tags.length > 0 && (
          <div className="tags">
            {w.tags.map((t) => (
              <span key={t} className="tag">{t}</span>
            ))}
          </div>
        )}

        <div className="ledger" style={{ margin: "20px 0" }}>
          <div className="row"><span>Price</span><span>{formatPrice(w.priceUsd)} USDC</span></div>
          <div className="row"><span>Network</span><span>{NETWORK_LABEL}</span></div>
          <div className="row"><span>Paid to</span><span>the creator · {short}</span></div>
          <div className="row"><span>Original</span><span>{w.width}×{w.height} {w.ext.toUpperCase()}</span></div>
        </div>

        <div className="eyebrow" style={{ marginBottom: 8 }}>License it with your agent</div>
        <div className="code">License Stockroom work {w.id} for my project.</div>
        <p className="muted" style={{ fontSize: 14 }}>
          Needs PayBox connected to Claude, ChatGPT or Grok, with Stockroom enabled. Or call the x402 endpoint directly:{" "}
          <span className="mono" style={{ wordBreak: "break-all" }}>{siteUrl()}/api/license/{w.id}</span>
        </p>

        <div className="eyebrow" style={{ margin: "24px 0 8px" }}>Licence terms</div>
        <ul className="terms">
          {TERMS_FULL.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <p style={{ marginTop: 24 }}>
          <Link href="/#catalogue">← Back to the catalogue</Link>
        </p>
      </div>
    </div>
  );
}
