import type { ProductStatus } from "../../../../src/data/site";
import { requireAdmin } from "../../../../src/server/admin-auth";
import { ensureContentSchema } from "../../../../src/server/content-store";
import { requireDatabase } from "../../../../src/server/bindings";

export const dynamic = "force-dynamic";

const allowedStatuses = new Set<ProductStatus>(["available", "soon", "finished"]);

export async function POST(request: Request) {
  const admin = requireAdmin(request);
  if (admin instanceof Response) return admin;
  const payload = await request.json() as { name?: string; description?: string; icon?: string; status?: ProductStatus; price?: string };
  const name = payload.name?.trim() ?? "";
  const description = payload.description?.trim() ?? "";
  const icon = payload.icon?.trim() ?? "";
  const status = payload.status;
  const price = payload.price?.trim() || null;
  if (!name || !description || !status || !allowedStatuses.has(status)) {
    return Response.json({ error: "Попълнете име, описание и наличност." }, { status: 400 });
  }

  await ensureContentSchema();
  const id = `custom-product-${crypto.randomUUID()}`;
  await requireDatabase().prepare(`INSERT INTO product_overrides
    (id, name, description, icon, status, price, image_id, sort_order, active, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, NULL, ?, 1, CURRENT_TIMESTAMP)`)
    .bind(id, name, description, icon, status, price, Date.now())
    .run();
  return Response.json({ ok: true, id }, { status: 201 });
}
