import { requireAdmin } from "../../../../src/server/admin-auth";
import { ensureContentSchema } from "../../../../src/server/content-store";
import { requireDatabase } from "../../../../src/server/bindings";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  const payload = await request.json() as { icon?: string; title?: string; description?: string; price?: string };
  const icon = payload.icon?.trim() ?? "";
  const title = payload.title?.trim() ?? "";
  const description = payload.description?.trim() ?? "";
  const price = payload.price?.trim() || null;
  if (!icon || !title || !description) {
    return Response.json({ error: "Попълнете символ, име и описание на услугата." }, { status: 400 });
  }

  await ensureContentSchema();
  const id = `custom-service-${crypto.randomUUID()}`;
  await requireDatabase().prepare(`INSERT INTO repair_service_overrides
    (id, icon, title, description, price, image_id, sort_order, active, updated_at)
    VALUES (?, ?, ?, ?, ?, NULL, ?, 1, CURRENT_TIMESTAMP)`)
    .bind(id, icon, title, description, price, Date.now())
    .run();
  return Response.json({ ok: true, id }, { status: 201 });
}
