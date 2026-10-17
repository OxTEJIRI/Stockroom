import { put, get, list, del } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";

// Vercel Blob when a token is present, local files under .data/ otherwise (dev only).
const useBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const access: "public" | "private" = process.env.BLOB_ACCESS === "public" ? "public" : "private";
const LOCAL_ROOT = path.join(process.cwd(), ".data");

function localPath(key: string) {
  const p = path.normalize(path.join(LOCAL_ROOT, key));
  if (!p.startsWith(LOCAL_ROOT)) throw new Error("bad key");
  return p;
}

export async function putBytes(key: string, data: Buffer, contentType: string) {
  if (useBlob) {
    await put(key, data, { access, contentType, addRandomSuffix: false, allowOverwrite: true });
    return;
  }
  const p = localPath(key);
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, data);
}

export async function getBytes(key: string): Promise<Buffer | null> {
  if (useBlob) {
    const r = await get(key, { access, useCache: false }).catch(() => null);
    if (!r || r.statusCode !== 200 || !r.stream) return null;
    return Buffer.from(await new Response(r.stream).arrayBuffer());
  }
  try {
    return await fs.readFile(localPath(key));
  } catch {
    return null;
  }
}

export async function putJson(key: string, value: unknown) {
  await putBytes(key, Buffer.from(JSON.stringify(value, null, 2)), "application/json");
}

export async function getJson<T>(key: string): Promise<T | null> {
  const buf = await getBytes(key);
  if (!buf) return null;
  try {
    return JSON.parse(buf.toString("utf8")) as T;
  } catch {
    return null;
  }
}

export async function listKeys(prefix: string): Promise<string[]> {
  if (useBlob) {
    const keys: string[] = [];
    let cursor: string | undefined;
    do {
      const page = await list({ prefix, cursor, limit: 1000 });
      keys.push(...page.blobs.map((b) => b.pathname));
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
    return keys;
  }
  const dir = localPath(prefix);
  try {
    const names = await fs.readdir(dir);
    return names.map((n) => `${prefix}${n}`);
  } catch {
    return [];
  }
}

export async function deleteKeys(keys: string[]) {
  if (keys.length === 0) return;
  if (useBlob) {
    await del(keys);
    return;
  }
  await Promise.all(keys.map((k) => fs.rm(localPath(k), { force: true })));
}
