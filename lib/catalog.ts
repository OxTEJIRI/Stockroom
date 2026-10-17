import type { SheetWork } from "@/app/components/Catalogue";
import { listLicenses, type License } from "./licenses";
import { listWorks, type Work } from "./works";

export function toSheet(works: Work[], licenses: License[]): SheetWork[] {
  const counts = new Map<string, number>();
  licenses.forEach((l) => counts.set(l.workId, (counts.get(l.workId) || 0) + 1));
  return works.map((w) => ({
    id: w.id,
    title: w.title,
    creatorName: w.creatorName,
    priceUsd: w.priceUsd,
    tags: w.tags,
    description: w.description,
    licences: counts.get(w.id) || 0,
  }));
}

export async function loadCatalog() {
  const [works, licenses] = await Promise.all([listWorks(), listLicenses()]);
  return { works, licenses, sheet: toSheet(works, licenses) };
}

export function shortAddr(a: string) {
  return a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "";
}

export function timeAgo(iso: string) {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return `${d} ${d === 1 ? "day" : "days"} ago`;
}
