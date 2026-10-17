import { MAX_UPLOAD_BYTES } from "@/lib/config";
import { createWork, listWorks, searchWorks, toPublic } from "@/lib/works";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q");
  const works = q ? await searchWorks(q, 50) : await listWorks();
  return Response.json({ works: works.map(toPublic) });
}

// Naive per-instance rate limit: 10 uploads per IP per 10 minutes.
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 10;
}

export async function POST(req: Request) {
  const ip = (req.headers.get("x-forwarded-for") || "local").split(",")[0].trim();
  if (limited(ip)) return Response.json({ error: "Too many uploads. Try again in a few minutes." }, { status: 429 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "Upload too large or malformed (max 4 MB)." }, { status: 400 });
  }
  const code = process.env.PUBLISH_CODE;
  if (code && String(form.get("code") || "") !== code) {
    return Response.json({ error: "Publishing is invite-only right now. Check your invite code." }, { status: 403 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Choose an image to upload." }, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES) return Response.json({ error: "Image must be 4 MB or smaller." }, { status: 400 });

  try {
    const work = await createWork({
      file: Buffer.from(await file.arrayBuffer()),
      title: String(form.get("title") || ""),
      description: String(form.get("description") || ""),
      tags: String(form.get("tags") || ""),
      creatorName: String(form.get("creatorName") || ""),
      payTo: String(form.get("payTo") || ""),
      price: String(form.get("price") || ""),
    });
    return Response.json({ work: toPublic(work) }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed.";
    return Response.json({ error: message }, { status: 400 });
  }
}
