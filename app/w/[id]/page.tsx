import Link from "next/link";
import { notFound } from "next/navigation";
import CopyButton from "@/app/components/CopyButton";
import Ledger from "@/app/components/Ledger";
import Loupe from "@/app/components/Loupe";
import { listLicenses } from "@/lib/licenses";
import { EXPLORER_ADDRESS, NETWORK_LABEL } from "@/lib/config";
import { TERMS_FULL } from "@/lib/terms";
import { formatPrice, getWork } from "@/lib/works";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const w = await getWork(id);
  return { title: w ? `${w.title} – Stockroom` : "Stockroom" };
}

export default async function WorkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const w = await getWork(id);
  if (!w) notFound();
  const sales = (await listLicenses()).filter((l) => l.workId === w.id);
  const short = `${w.payTo.slice(0, 6)}…${w.payTo.slice(-4)}`;
  const prompt = `License Stockroom work ${w.id} for my project.`;

  return (
    <div className="wrap work">
      <figure className="bigmount" style={{ margin: 0 }}>
        <Loupe src={`/media/preview/${w.id}`} size={190} zoom={2.2}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/media/preview/${w.id}`} alt={w.title} width={w.width} height={w.height} />
        </Loupe>
        <figcaption className="note">
          <span>{w.title}</span>
          <em>{formatPrice(w.priceUsd)}</em>
        </figcaption>
      </figure>

      <div>
        <h1>{w.title}</h1>
        <p className="by">
          By <Link href={`/c/${w.payTo}`}>{w.creatorName}</Link>, {w.width}×{w.height} {w.ext.toUpperCase()}
          {sales.length > 0 && `, licensed ${sales.length} ${sales.length === 1 ? "time" : "times"}`}
        </p>
        {w.description && <p className="desc">{w.description}</p>}
        {w.tags.length > 0 && (
          <div className="chips">
            {w.tags.map((t) => (
              <span key={t} className="chip">{t}</span>
            ))}
          </div>
        )}

        <div className="buy">
          <div className="price">
            {formatPrice(w.priceUsd)}
            <small>USDC on {NETWORK_LABEL}</small>
          </div>
          <p className="to">
            Paid in full to the creator&apos;s wallet{" "}
            <a href={`${EXPLORER_ADDRESS}${w.payTo}`} target="_blank" rel="noreferrer" className="mono">
              {short}
            </a>
            . The preview is watermarked; the licence unlocks the original.
          </p>
          <div className="prompt">
            <span>{prompt}</span>
            <CopyButton value={prompt} />
          </div>
          <p className="fine">
            Paste this to your agent with PayBox connected. You&apos;ll approve the payment with your passkey.
          </p>
        </div>

        <h2 className="h3">What the licence allows</h2>
        <ul className="terms-list">
          {TERMS_FULL.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        {sales.length > 0 && (
          <>
            <h2 className="h3" style={{ marginTop: 28 }}>Licence history</h2>
            <Ledger licenses={sales} limit={5} />
          </>
        )}
        <p style={{ marginTop: 28 }}>
          <Link href="/#catalogue">Back to the catalogue</Link>
        </p>
      </div>
    </div>
  );
}
