import { deleteWork, getWork, toPublic } from "@/lib/works";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const work = await getWork(id);
  if (!work) return Response.json({ error: "Work not found" }, { status: 404 });
  return Response.json({ work: toPublic(work) });
}

// Takedown: DELETE with header `x-admin-key: $ADMIN_KEY`.
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const key = process.env.ADMIN_KEY;
  if (!key || req.headers.get("x-admin-key") !== key) return Response.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const ok = await deleteWork(id);
  return Response.json({ deleted: ok }, { status: ok ? 200 : 404 });
}
