import { requireAdmin } from "../../../../src/server/admin-auth";
import { readManagedContent } from "../../../../src/server/content-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;

  try {
    return Response.json(await readManagedContent(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json({ error: "Данните не могат да бъдат заредени." }, { status: 503 });
  }
}
