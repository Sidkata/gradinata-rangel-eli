import type { ProductStatus } from "../../../../../src/data/site";
import { requireAdmin } from "../../../../../src/server/admin-auth";
import { ensureContentSchema, readManagedContent } from "../../../../../src/server/content-store";
import { requireDatabase, requireMediaBucket } from "../../../../../src/server/bindings";

export const dynamic = "force-dynamic";

const allowedStatuses = new Set<ProductStatus>(["available", "soon", "finished"]);

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;

  const { id } = await context.params;
  const current = (await readManagedContent()).products.find((product) => product.id === id);
  if (!current) return Response.json({ error: "Непознат продукт." }, { status: 404 });

  let payload: { name?: string; description?: string; icon?: string; status?: ProductStatus; price?: string };
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Невалидни данни." }, { status: 400 });
  }

  const name = payload.name?.trim() ?? "";
  const description = payload.description?.trim() ?? "";
  const icon = payload.icon?.trim() ?? "";
  const status = payload.status;
  const price = payload.price?.trim() || null;
  if (!name || !description || !status || !allowedStatuses.has(status)) {
    return Response.json({ error: "Попълнете име, описание и наличност." }, { status: 400 });
  }

  await ensureContentSchema();
  const db = requireDatabase();
  await db.prepare(`INSERT INTO product_overrides
    (id, name, description, icon, status, price, image_id, sort_order, active, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, NULL, ?, 1, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      description = excluded.description,
      icon = excluded.icon,
      status = excluded.status,
      price = excluded.price,
      sort_order = excluded.sort_order,
      active = 1,
      updated_at = CURRENT_TIMESTAMP`)
    .bind(id, name, description, icon, status, price, current.sortOrder)
    .run();

  return Response.json({ ok: true });
}

type ProductMediaRow = { image_id: string | null; r2_key: string | null };

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  const { id } = await context.params;
  const current = (await readManagedContent()).products.find((product) => product.id === id);
  if (!current) return Response.json({ error: "Продуктът не е намерен." }, { status: 404 });

  await ensureContentSchema();
  const db = requireDatabase();
  const media = await db.prepare(`SELECT product_overrides.image_id, media.r2_key
    FROM product_overrides LEFT JOIN media ON media.id = product_overrides.image_id
    WHERE product_overrides.id = ?`)
    .bind(id)
    .first<ProductMediaRow>();

  await db.prepare(`INSERT INTO product_overrides
    (id, name, description, icon, status, price, image_id, sort_order, active, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, NULL, ?, 0, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET active = 0, image_id = NULL, updated_at = CURRENT_TIMESTAMP`)
    .bind(id, current.name, current.description, current.icon, current.status, current.price, current.sortOrder)
    .run();

  if (media?.image_id && media.r2_key) {
    await requireMediaBucket().delete(media.r2_key);
    await db.prepare("DELETE FROM media WHERE id = ?").bind(media.image_id).run();
  }
  return Response.json({ ok: true });
}
