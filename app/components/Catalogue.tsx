"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type SheetWork = {
  id: string;
  title: string;
  creatorName: string;
  priceUsd: number;
  tags: string[];
  description: string;
  licences: number;
};

export default function Catalogue({ works, filters = true }: { works: SheetWork[]; filters?: boolean }) {
  const [q, setQ] = useState("");
  const [tag, setTag] = useState<string | null>(null);

  const topTags = useMemo(() => {
    const counts = new Map<string, number>();
    works.forEach((w) => w.tags.forEach((t) => counts.set(t, (counts.get(t) || 0) + 1)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([t]) => t);
  }, [works]);

  const shown = useMemo(() => {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    return works.filter((w) => {
      if (tag && !w.tags.includes(tag)) return false;
      if (terms.length === 0) return true;
      const hay = `${w.title} ${w.creatorName} ${w.tags.join(" ")} ${w.description}`.toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
  }, [works, q, tag]);

  return (
    <>
      {filters && works.length > 0 && (
        <div className="filters">
          <input
            className="input search"
            type="search"
            placeholder="Search by what's in the picture"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search the catalogue"
          />
          {topTags.length > 0 && (
            <div className="tagrow" role="group" aria-label="Filter by tag">
              <button type="button" className={`tagbtn ${tag === null ? "on" : ""}`} onClick={() => setTag(null)}>
                All
              </button>
              {topTags.map((t) => (
                <button key={t} type="button" className={`tagbtn ${tag === t ? "on" : ""}`} onClick={() => setTag(tag === t ? null : t)}>
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="sheet">
        {works.length === 0 ? (
          <div className="sheet-empty">
            Nothing on the sheet yet. <Link href="/publish">List the first photo</Link>.
          </div>
        ) : shown.length === 0 ? (
          <div className="sheet-empty">
            No frames match that. <button type="button" className="linklike" onClick={() => { setQ(""); setTag(null); }}>Clear the search</button>
          </div>
        ) : (
          <div className="sheet-grid">
            {shown.map((w) => (
              <Link key={w.id} href={`/w/${w.id}`} className="frame">
                <div className="shot">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/media/thumb/${w.id}`} alt={w.title} loading="lazy" />
                  {w.licences > 0 && (
                    <span className="sold" title={`Licensed ${w.licences} ${w.licences === 1 ? "time" : "times"}`}>
                      <svg viewBox="0 0 40 40" aria-hidden>
                        <path d="M20 3 C 31 2, 38 10, 37 20 C 36 31, 28 38, 19 37 C 9 36, 3 29, 3 19 C 4 9, 12 3, 22 4" />
                        <path d="M12 21 L 18 27 L 29 13" />
                      </svg>
                      {w.licences}
                    </span>
                  )}
                </div>
                <div className="edge">
                  <span className="n">{String(works.indexOf(w) + 1).padStart(2, "0")}A</span>
                  <span className="t">{w.title}</span>
                  <span className="p">${w.priceUsd.toFixed(2)}</span>
                </div>
                <div className="by">{w.creatorName}</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
