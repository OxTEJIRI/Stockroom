import { getBytes } from "@/lib/storage";

export const dynamic = "force-dynamic";

const FOLDERS: Record<string, string> = { preview: "previews", thumb: "thumbs" };

export async function GET(_req: Request, { params }: { params: Promise<{ kind: string; id: string }> }) {
  const { kind, id } = await params;
  const folder = FOLDERS[kind];
  if (!folder || !/^[A-Za-z0-9]{4,32}$/.test(id)) return new Response("Not found", { status: 404 });
  const img = await getBytes(`${folder}/${id}.jpg`);
  if (!img) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(img), {
    headers: {
      "content-type": "image/jpeg",
      "cache-control": "public, max-age=3600, s-maxage=86400, immutable",
    },
  });
}
