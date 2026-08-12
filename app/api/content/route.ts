import { readManagedContent } from "../../../src/server/content-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const content = await readManagedContent();
    return Response.json(content, {
      headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=300" },
    });
  } catch {
    return Response.json({ error: "Съдържанието временно не може да бъде заредено." }, { status: 503 });
  }
}
