import { timingSafeEqual } from "crypto";
import { getLicense } from "@/lib/licenses";
import { getBytes } from "@/lib/storage";
import { getWork } from "@/lib/works";

export const dynamic = "force-dynamic";

function sameToken(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export async function GET(req: Request, { params }: { params: Promise<{ licenseId: string }> }) {
  const { licenseId } = await params;
  const token = new URL(req.url).searchParams.get("t") || "";
  const license = await getLicense(licenseId);
  if (!license || !sameToken(token, license.downloadToken)) {
    return Response.json({ error: "Invalid or expired download link." }, { status: 403 });
  }
  const work = await getWork(license.workId);
  if (!work) return Response.json({ error: "This work has been removed." }, { status: 410 });
  const file = await getBytes(work.originalKey);
  if (!file) return Response.json({ error: "File unavailable." }, { status: 404 });

  const slug = work.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || work.id;
  return new Response(new Uint8Array(file), {
    headers: {
      "content-type": work.originalType,
      "content-disposition": `attachment; filename="stockroom-${slug}-${license.id}.${work.ext}"`,
      "cache-control": "private, no-store",
    },
  });
}
