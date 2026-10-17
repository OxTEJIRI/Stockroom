// Upload a folder of images to a Stockroom site.
//   node scripts/seed.mjs <site url> <folder>
// The folder needs a seed.json:
//   { "creatorName": "...", "payTo": "0x...", "price": 0.25,
//     "works": [{ "file": "a.jpg", "title": "...", "description": "...", "tags": "a, b", "price": 0.5 }] }
// Images over 4 MB are re-encoded as JPEG to fit the upload limit.
import { readFile } from "fs/promises";
import path from "path";
import sharp from "sharp";

const [site, folder] = process.argv.slice(2);
if (!site || !folder) throw new Error("usage: node scripts/seed.mjs <site url> <folder>");
const manifest = JSON.parse(await readFile(path.join(folder, "seed.json"), "utf8"));
const LIMIT = 4 * 1024 * 1024;

for (const w of manifest.works) {
  let data = await readFile(path.join(folder, w.file));
  let name = w.file;
  if (data.length > LIMIT) {
    data = await sharp(data).rotate().resize({ width: 4000, height: 4000, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 88 }).toBuffer();
    name = name.replace(/\.\w+$/, ".jpg");
  }
  const form = new FormData();
  form.set("file", new File([data], name));
  form.set("title", w.title);
  form.set("description", w.description || "");
  form.set("tags", w.tags || "");
  form.set("creatorName", w.creatorName || manifest.creatorName || "");
  form.set("payTo", w.payTo || manifest.payTo);
  form.set("price", String(w.price ?? manifest.price ?? 0.25));
  if (manifest.code) form.set("code", manifest.code);
  const res = await fetch(`${site.replace(/\/$/, "")}/api/works`, { method: "POST", body: form });
  const body = await res.json().catch(() => ({}));
  console.log(res.ok ? `✓ ${w.title} → ${body.work.url}` : `✗ ${w.title}: ${body.error || res.status}`);
}
