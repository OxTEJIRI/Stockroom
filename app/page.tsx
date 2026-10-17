import Link from "next/link";
import CopyButton from "./components/CopyButton";
import { siteUrl } from "@/lib/config";
import { formatPrice, listWorks, type Work } from "@/lib/works";

export const dynamic = "force-dynamic";

const FALLBACK = [
  { title: "Your photo", price: "$0.25", bg: "linear-gradient(135deg,#9a5a2c,#e2a865)" },
  { title: "Their illustration", price: "$1.00", bg: "linear-gradient(135deg,#29566a,#7cc0cf)" },
  { title: "A street at dusk", price: "$0.50", bg: "linear-gradient(135deg,#3d3a5c,#c48c8a)" },
];

function slide(works: Work[], i: number) {
  const w = works[i];
  if (w) return { title: w.title, price: formatPrice(w.priceUsd), bg: `url(/media/thumb/${w.id})` };
  return FALLBACK[i];
}

export default async function Home() {
  const works = await listWorks();
  const creators = new Set(works.map((w) => w.payTo)).size;
  const mcpUrl = `${siteUrl()}/api/mcp`;
  const picked = slide(works, 1);

  return (
    <>
      <section className="hero">
        <div className="wrap">
          <div>
            <h1>
              Your agent licenses the photo.
              <span>The photographer gets paid.</span>
            </h1>
            <p className="lede">
              Stockroom is a library of photos and illustrations made by people. Agents in Claude, ChatGPT and Grok
              license them through PayBox: you approve with your passkey, the USDC goes straight to the creator, and the
              payment is the licence.
            </p>
            <div className="ctas">
              <Link href="/agents" className="btn">Connect your agent</Link>
              <Link href="/publish" className="btn line">Sell your work</Link>
            </div>
            <p className="fact">
              {works.length > 0
                ? `${works.length} ${works.length === 1 ? "work" : "works"} from ${creators} ${creators === 1 ? "creator" : "creators"} so far. Stockroom takes no cut.`
                : "The shelves are being stocked. Stockroom takes no cut."}
            </p>
          </div>

          <div className="table" aria-label="An agent picks a photo and the user approves the payment">
            {[0, 1, 2].map((i) => {
              const s = slide(works, i);
              return (
                <figure key={i} className={`mount m${i + 1}`} style={{ margin: 0 }}>
                  <div className="win" style={{ backgroundImage: s.bg }} />
                  <figcaption className="label">
                    <span>{s.title}</span>
                    <em>{s.price}</em>
                  </figcaption>
                </figure>
              );
            })}
            <svg className="grease-ring" viewBox="0 0 400 300" aria-hidden>
              <path d="M210 18 C 320 10, 392 70, 384 150 C 376 236, 290 286, 196 282 C 96 278, 14 230, 16 148 C 18 70, 96 22, 214 26 C 250 28, 282 36, 300 46" />
            </svg>
            <div className="ask">
              <small>You, to your agent</small>
              Find a warm photo of a coffee shop for my landing page and license it.
            </div>
            <div className="approve" role="img" aria-label={`PayBox approval for ${picked.price} USDC`}>
              <div className="row">
                <span className="who">PayBox approval</span>
                <span className="who">Base</span>
              </div>
              <div className="amt">{picked.price} USDC</div>
              <div className="key">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                  <circle cx="8" cy="15" r="4" />
                  <path d="M10.8 12.2 20 3M16 7l3 3M14 9l2 2" />
                </svg>
                Approve with passkey
              </div>
              <div className="paid">Paid to the creator. Licence issued.</div>
            </div>
          </div>
        </div>
      </section>

      <section className="strip" aria-label="How a licence happens">
        <div className="wrap">
          <div className="cell">
            <div className="num">1</div>
            <h3>A creator lists a photo</h3>
            <p>Upload it, set a price, add a Base wallet. Agents only ever see a watermarked preview.</p>
          </div>
          <div className="cell">
            <div className="num">2</div>
            <h3>Your agent picks it</h3>
            <p>It searches by what the image shows and checks with you before it spends anything.</p>
          </div>
          <div className="cell">
            <div className="num">3</div>
            <h3>You approve, they get paid</h3>
            <p>One passkey tap. USDC goes wallet to wallet, and the agent gets the full file plus a receipt anyone can check.</p>
          </div>
        </div>
      </section>

      <section className="section" id="catalogue">
        <div className="wrap">
          <div className="section-head">
            <h2>Catalogue</h2>
            <p>Every frame here was made by a person. Prices are per licence and go to the creator in full.</p>
          </div>
          <div className="sheet">
            {works.length === 0 ? (
              <div className="sheet-empty">
                Nothing on the sheet yet. <Link href="/publish">List the first photo</Link>.
              </div>
            ) : (
              <div className="sheet-grid">
                {works.map((w, i) => (
                  <Link key={w.id} href={`/w/${w.id}`} className="frame">
                    <div className="shot">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/media/thumb/${w.id}`} alt={w.title} loading="lazy" />
                    </div>
                    <div className="edge">
                      <span className="n">{String(i + 1).padStart(2, "0")}A</span>
                      <span className="t">{w.title}</span>
                      <span className="p">{formatPrice(w.priceUsd)}</span>
                    </div>
                    <div className="by">{w.creatorName}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 24 }}>
        <div className="wrap agent">
          <div>
            <h2 className="h2" style={{ marginBottom: 14 }}>Add Stockroom to your agent</h2>
            <p>
              Turn on Stockroom in PayBox&apos;s plugins, or add it to any MCP client with this address. Your agent can
              search for free; it only pays when you approve a licence.
            </p>
            <div className="urlbox">
              <code>{mcpUrl}</code>
              <CopyButton value={mcpUrl} />
            </div>
            <p style={{ marginTop: 16 }}>
              <Link href="/agents">See how a purchase works</Link>
            </p>
          </div>
          <div className="convo" aria-label="Example conversation">
            <div className="msg me">I&apos;m building a site for a coffee shop in Lagos. Find a hero photo and license it.</div>
            <div className="msg bot">I found three on Stockroom. &ldquo;Morning pour&rdquo; fits best: warm light, wide crop, room for a headline. It&apos;s $0.25, paid straight to the photographer.</div>
            <div className="msg sys">You approved $0.25 USDC with your passkey</div>
            <div className="msg bot">Licensed. Here&apos;s the full-resolution file and your licence receipt.</div>
          </div>
        </div>
      </section>
    </>
  );
}
