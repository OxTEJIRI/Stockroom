import { randomBytes } from "crypto";
import { getAddress, isAddress } from "viem";
import { deleteKeys, getJson, listKeys, putBytes, putJson } from "./storage";
import { processUpload } from "./images";
import { MAX_PRICE, MIN_PRICE, siteUrl } from "./config";

export type Work = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  creatorName: string;
  payTo: `0x${string}`;
  priceUsd: number;
  width: number;
  height: number;
  originalKey: string;
  originalType: string;
  ext: string;
  createdAt: string;
};

export type PublicWork = Omit<Work, "originalKey" | "originalType"> & {
  url: string;
  previewUrl: string;
  thumbUrl: string;
};

export function newId(bytes = 6) {
  return randomBytes(bytes).toString("base64url").replace(/[-_]/g, "x").slice(0, bytes * 2);
}

export function toPublic(w: Work): PublicWork {
  const { originalKey: _k, originalType: _t, ...rest } = w;
  const base = siteUrl();
  return {
    ...rest,
    url: `${base}/w/${w.id}`,
    previewUrl: `${base}/media/preview/${w.id}`,
    thumbUrl: `${base}/media/thumb/${w.id}`,
  };
}

export function formatPrice(n: number) {
  return `$${n.toFixed(2)}`;
}

// Small in-memory cache per server instance so the catalogue isn't re-listed on every request.
let cache: { at: number; works: Work[] } | null = null;
const CACHE_MS = 20_000;

export async function listWorks(): Promise<Work[]> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.works;
  const keys = (await listKeys("works/")).filter((k) => k.endsWith(".json"));
  const works = (await Promise.all(keys.map((k) => getJson<Work>(k)))).filter((w): w is Work => Boolean(w));
  works.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  cache = { at: Date.now(), works };
  return works;
}

export async function getWork(id: string): Promise<Work | null> {
  if (!/^[A-Za-z0-9]{4,32}$/.test(id)) return null;
  return getJson<Work>(`works/${id}.json`);
}

export async function searchWorks(query: string, limit = 12): Promise<Work[]> {
  const works = await listWorks();
  const terms = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1);
  if (terms.length === 0) return works.slice(0, limit);
  const scored = works
    .map((w) => {
      const title = w.title.toLowerCase();
      const tags = w.tags.join(" ").toLowerCase();
      const desc = w.description.toLowerCase();
      let score = 0;
      for (const t of terms) {
        if (title.includes(t)) score += 3;
        if (tags.includes(t)) score += 2;
        if (desc.includes(t)) score += 1;
      }
      return { w, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.w);
}

export type NewWorkInput = {
  file: Buffer;
  title: string;
  description: string;
  tags: string;
  creatorName: string;
  payTo: string;
  price: string | number;
};

export async function createWork(input: NewWorkInput): Promise<Work> {
  const title = input.title.trim().slice(0, 90);
  if (title.length < 3) throw new Error("Add a title (at least 3 characters).");
  const creatorName = input.creatorName.trim().slice(0, 60) || "Anonymous";
  const description = input.description.trim().slice(0, 600);
  const tags = input.tags
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 12)
    .map((t) => t.slice(0, 30));
  const payToRaw = input.payTo.trim();
  if (!isAddress(payToRaw)) throw new Error("Enter a valid Base wallet address (0x…).");
  const payTo = getAddress(payToRaw);
  const priceUsd = Math.round(Number(input.price) * 100) / 100;
  if (!Number.isFinite(priceUsd) || priceUsd < MIN_PRICE || priceUsd > MAX_PRICE) {
    throw new Error(`Price must be between $${MIN_PRICE} and $${MAX_PRICE}.`);
  }

  const img = await processUpload(input.file);
  const id = newId();
  const originalKey = `originals/${id}-${randomBytes(12).toString("hex")}.${img.ext}`;
  await Promise.all([
    putBytes(originalKey, img.original, img.originalType),
    putBytes(`previews/${id}.jpg`, img.preview, "image/jpeg"),
    putBytes(`thumbs/${id}.jpg`, img.thumb, "image/jpeg"),
  ]);
  const work: Work = {
    id,
    title,
    description,
    tags,
    creatorName,
    payTo,
    priceUsd,
    width: img.width,
    height: img.height,
    originalKey,
    originalType: img.originalType,
    ext: img.ext,
    createdAt: new Date().toISOString(),
  };
  await putJson(`works/${id}.json`, work);
  cache = null;
  return work;
}

export async function deleteWork(id: string) {
  const w = await getWork(id);
  if (!w) return false;
  await deleteKeys([`works/${id}.json`, `previews/${id}.jpg`, `thumbs/${id}.jpg`, w.originalKey]);
  cache = null;
  return true;
}
