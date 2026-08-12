import { requireAdmin } from "../../../../../src/server/admin-auth";
import { ensureContentSchema, readManagedContent } from "../../../../../src/server/content-store";
import { requireDatabase, requireMediaBucket } from "../../../../../src/server/bindings";

export const dynamic = "force-dynamic";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const admin = requireAdmin(request);
  if (admin instanceof Response) return admin;
  const { id } = await context.params;
  const current = (await readManagedContent()).repairServices.find((service) => service.id === id);
  if (!current) return Response.json({ error: "Услугата не е намерена." }, { status: 404 });

  const payload = await request.json() as { icon?: string; title?: string; description?: string; price?: string };
  const icon = payload.icon?.trim() ?? "";
  const title = payload.title?.trim() ?? "";
  const description = payload.description?.trim() ?? "";
  const price = payload.price?.trim() || null;
  if (!icon || !title || !description) {
    return Response.json({ error: "Попълнете символ, име и описание на услугата." }, { status: 400 });
  }

  await ensureContentSchema();
  await requireDatabase().prepare(`INSERT INTO repair_service_overrides
    (id, icon, title, description, price, image_id, sort_order, active, updated_at)
    VALUES (?, ?, ?, ?, ?, NULL, ?, 1, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      icon = excluded.icon,
      title = excluded.title,
      description = excluded.description,
      price = excluded.price,
      sort_order = excluded.sort_order,
      active = 1,
      updated_at = CURRENT_TIMESTAMP`)
    .bind(id, icon, title, description, price, current.sortOrder)
    .run();
  return Response.json({ ok: true });
}

type ServiceMediaRow = { image_id: string | null; r2_key: string | null };

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const admin = requireAdmin(request);
  if (admin instanceof Response) return admin;
  const { id } = await context.params;
  const current = (await readManagedContent()).repairServices.find((service) => service.id === id);
  if (!current) return Response.json({ error: "Услугата не е намерена." }, { status: 404 });

  await ensureContentSchema();
  const db = requireDatabase();
  const media = await db.prepare(`SELECT repair_service_overrides.image_id, media.r2_key
    FROM repair_service_overrides LEFT JOIN media ON media.id = repair_service_overrides.image_id
    WHERE repair_service_overrides.id = ?`)
    .bind(id)
    .first<ServiceMediaRow>();
  await db.prepare(`INSERT INTO repair_service_overrides
    (id, icon, title, description, price, image_id, sort_order, active, updated_at)
    VALUES (?, ?, ?, ?, ?, NULL, ?, 0, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET active = 0, image_id = NULL, updated_at = CURRENT_TIMESTAMP`)
    .bind(id, current.icon, current.title, current.description, current.price, current.sortOrder)
    .run();
  if (media?.image_id && media.r2_key) {
    await requireMediaBucket().delete(media.r2_key);
    await db.prepare("DELETE FROM media WHERE id = ?").bind(media.image_id).run();
  }
  return Response.json({ ok: true });
}
