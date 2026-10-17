import Link from "next/link";
import { EXPLORER_TX } from "@/lib/config";
import { shortAddr, timeAgo } from "@/lib/catalog";
import type { License } from "@/lib/licenses";
import { formatPrice } from "@/lib/works";

/** Recent licences as sales slips, each tied to its Base transaction. */
export default function Ledger({ licenses, limit = 6 }: { licenses: License[]; limit?: number }) {
  if (licenses.length === 0) {
    return (
      <div className="slips-empty">
        No licences yet. When an agent buys one, it appears here with its transaction on Base.
      </div>
    );
  }
  return (
    <ol className="slips">
      {licenses.slice(0, limit).map((l) => (
        <li key={l.id} className="slip">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/media/thumb/${l.workId}`} alt="" loading="lazy" />
          <div className="what">
            <Link href={`/l/${l.id}`} className="t">{l.workTitle}</Link>
            <span className="for">{l.project ? `for ${l.project}` : `by ${l.creatorName}`}</span>
          </div>
          <div className="paid">
            <span className="amt">{formatPrice(l.amountUsd)}</span>
            <span className="to">
              to <Link href={`/c/${l.payTo}`}>{shortAddr(l.payTo)}</Link>, {timeAgo(l.createdAt)}
            </span>
          </div>
          {l.txHash ? (
            <a className="tx" href={`${EXPLORER_TX}${l.txHash}`} target="_blank" rel="noreferrer">
              View transaction
            </a>
          ) : (
            <span className="tx muted">No transaction</span>
          )}
        </li>
      ))}
    </ol>
  );
}
