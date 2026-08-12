import { requireAdmin } from "../../../../../src/server/admin-auth";
import { requireDatabase, requireMediaBucket } from "../../../../../src/server/bindings";
import { ensureContentSchema } from "../../../../../src/server/content-store";

export const dynamic = "force-dynamic";

type GalleryMediaRow = { image_id: string; r2_key: string };

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  const { id } = await context.params;
  if (!id.startsWith("upload-")) return Response.json({ error: "Тази снимка е част от първоначалния сайт." }, { status: 400 });

  await ensureContentSchema();
  const db = requireDatabase();
  const row = await db.prepare(`SELECT gallery_uploads.image_id, media.r2_key
    FROM gallery_uploads JOIN media ON media.id = gallery_uploads.image_id
    WHERE gallery_uploads.id = ?`)
    .bind(id)
    .first<GalleryMediaRow>();
  if (!row) return Response.json({ error: "Снимката не е намерена." }, { status: 404 });

  await db.prepare("DELETE FROM gallery_uploads WHERE id = ?").bind(id).run();
  await requireMediaBucket().delete(row.r2_key);
  await db.prepare("DELETE FROM media WHERE id = ?").bind(row.image_id).run();
  return Response.json({ ok: true });
}
