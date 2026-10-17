import Link from "next/link";
import { NETWORK_LABEL, siteUrl } from "@/lib/config";
import { formatPrice, listWorks } from "@/lib/works";

export const dynamic = "force-dynamic";

export default async function Home() {
  const works = await listWorks();
  const creators = new Set(works.map((w) => w.payTo)).size;
  const mcpUrl = `${siteUrl()}/api/mcp`;

  return (
    <>
      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            <div className="eyebrow">A PayBox plugin · x402 · USDC on {NETWORK_LABEL}</div>
            <h1>
              Stock media your agent <em>pays</em> the creator for.
            </h1>
            <p className="lede">
              Creators list photos and illustrations. AI agents license them through PayBox. The USDC goes straight to
              the creator&apos;s wallet, and the payment itself is the licence.
            </p>
            <div className="ctas">
              <Link href="/agents" className="btn">Connect your agent</Link>
              <Link href="/publish" className="btn ghost">Sell your work</Link>
            </div>
          </div>
          <div className="ledger" aria-label="Catalogue summary">
            <div className="head">
              <span>Stockroom ledger</span>
              <span className="stamp">Paid on-chain</span>
            </div>
            <div className="row"><span>Works listed</span><span>{works.length}</span></div>
            <div className="row"><span>Creators</span><span>{creators}</span></div>
            <div className="row"><span>Platform fee</span><span>0%</span></div>
            <div className="row"><span>Paid to</span><span>the creator, directly</span></div>
            <div className="row"><span>Proof of licence</span><span>the transaction</span></div>
          </div>
        </div>
      </section>

      <section className="wrap steps">
        <div className="step">
          <div className="n">01</div>
          <h3>A creator lists a work</h3>
          <p>Upload an image, set a price and paste a Base wallet. Stockroom keeps the original locked and shows a watermarked preview.</p>
        </div>
        <div className="step">
          <div className="n">02</div>
          <h3>An agent licenses it</h3>
          <p>Claude, ChatGPT or Grok finds it, PayBox asks you to approve with your passkey, and the USDC moves wallet to wallet.</p>
        </div>
        <div className="step">
          <div className="n">03</div>
          <h3>The payment is the licence</h3>
          <p>The agent gets the full file and a receipt tied to the on-chain transaction. Anyone can verify it.</p>
        </div>
      </section>

      <section className="section" id="catalogue">
        <div className="wrap">
          <div className="section-head">
            <h2>The catalogue</h2>
            <span className="eyebrow">{works.length} works · every one made by a person</span>
          </div>
          {works.length === 0 ? (
            <div className="empty">
              Nothing listed yet. <Link href="/publish">Be the first to sell a work</Link>.
            </div>
          ) : (
            <div className="grid">
              {works.map((w) => (
                <Link key={w.id} href={`/w/${w.id}`} className="tile">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/media/thumb/${w.id}`} alt={w.title} width={w.width} height={w.height} loading="lazy" />
                  <div className="meta">
                    <div>
                      <div className="t">{w.title}</div>
                      <div className="c">by {w.creatorName}</div>
                    </div>
                    <span className="price">{formatPrice(w.priceUsd)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="wrap agent" style={{ paddingTop: 48 }}>
          <div>
            <div className="eyebrow">For agents</div>
            <h2 style={{ fontFamily: "var(--serif)", fontWeight: 400, fontSize: 40, margin: "8px 0 12px", lineHeight: 1.05 }}>
              One plugin. Your agent stops scraping.
            </h2>
            <p className="muted" style={{ marginTop: 0 }}>
              Enable Stockroom in PayBox, or add it to any MCP client with this URL:
            </p>
            <div className="code">{mcpUrl}</div>
            <p style={{ marginTop: 16 }}>
              <Link href="/agents">How it works for agents →</Link>
            </p>
          </div>
          <div className="chat" aria-label="Example conversation">
            <div className="bubble user">I&apos;m building a landing page for a coffee shop in Lagos. Find a hero photo and license it.</div>
            <div className="bubble bot">Found 3 on Stockroom. &ldquo;Morning pour&rdquo; by a Lagos photographer fits best: warm light, wide crop. It&apos;s $0.25, paid directly to the creator.</div>
            <div className="bubble pay">PayBox · approve $0.25 USDC on Base → creator wallet · passkey ✓</div>
            <div className="bubble bot">Licensed. Here&apos;s the full-resolution file and your licence receipt.</div>
          </div>
        </div>
      </section>
    </>
  );
}
