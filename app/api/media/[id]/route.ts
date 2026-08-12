import { requireDatabase, requireMediaBucket } from "../../../../src/server/bindings";
import { ensureContentSchema } from "../../../../src/server/content-store";

export const dynamic = "force-dynamic";

type MediaRow = { r2_key: string; content_type: string };

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  await ensureContentSchema();
  const row = await requireDatabase()
    .prepare("SELECT r2_key, content_type FROM media WHERE id = ?")
    .bind(id)
    .first<MediaRow>();
  if (!row) return new Response("Not found", { status: 404 });

  const object = await requireMediaBucket().get(row.r2_key);
  if (!object) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("Content-Type", row.content_type);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  headers.set("ETag", object.httpEtag);
  return new Response(object.body, { headers });
}
