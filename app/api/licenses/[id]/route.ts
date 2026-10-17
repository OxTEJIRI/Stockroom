import { getLicense, licensePublic } from "@/lib/licenses";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const license = await getLicense(id);
  if (!license) return Response.json({ valid: false, error: "No licence with that id." }, { status: 404 });
  return Response.json(licensePublic(license));
}
