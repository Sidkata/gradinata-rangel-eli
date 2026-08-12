import { requireAdmin } from "../../../../src/server/admin-auth";
import { requireDatabase, requireMediaBucket } from "../../../../src/server/bindings";
import { ensureContentSchema, readManagedContent } from "../../../../src/server/content-store";

export const dynamic = "force-dynamic";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const allowedCategories = new Set(["Градината", "Продукция", "Ремонти", "Завършени обекти"]);
const maxFileSize = 8 * 1024 * 1024;

function uploadError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return uploadError("Снимката не може да бъде прочетена.");
  }

  const file = form.get("file");
  const kind = form.get("kind");
  if (!(file instanceof File) || (kind !== "product" && kind !== "service" && kind !== "gallery")) {
    return uploadError("Изберете снимка и място за нея.");
  }
  if (!allowedTypes.has(file.type)) return uploadError("Използвайте JPG, PNG, WebP или AVIF снимка.");
  if (file.size <= 0 || file.size > maxFileSize) return uploadError("Снимката трябва да е по-малка от 8 MB.");

  await ensureContentSchema();
  const db = requireDatabase();
  const bucket = requireMediaBucket();
  const mediaId = crypto.randomUUID();
  const extension = file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "img";
  const r2Key = `uploads/${mediaId}.${extension}`;

  await bucket.put(r2Key, file.stream(), {
    httpMetadata: { contentType: file.type, cacheControl: "public, max-age=31536000, immutable" },
    customMetadata: { originalName: file.name, uploadedBy: admin.email },
  });

  try {
    await db.prepare(`INSERT INTO media
      (id, r2_key, filename, content_type, size, uploaded_by)
      VALUES (?, ?, ?, ?, ?, ?)`)
      .bind(mediaId, r2Key, file.name, file.type, file.size, admin.email)
      .run();

    if (kind === "product") {
      const targetId = String(form.get("targetId") ?? "");
      const product = (await readManagedContent()).products.find((item) => item.id === targetId);
      if (!product) throw new Error("Непознат продукт.");
      const previous = await db.prepare(`SELECT product_overrides.image_id, media.r2_key
        FROM product_overrides LEFT JOIN media ON media.id = product_overrides.image_id
        WHERE product_overrides.id = ?`)
        .bind(targetId)
        .first<{ image_id: string | null; r2_key: string | null }>();
      await db.prepare(`INSERT INTO product_overrides
        (id, name, description, icon, status, price, image_id, sort_order, active, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET image_id = excluded.image_id, active = 1, updated_at = CURRENT_TIMESTAMP`)
        .bind(targetId, product.name, product.description, product.icon, product.status, product.price, mediaId, product.sortOrder)
        .run();
      if (previous?.image_id && previous.r2_key) {
        await bucket.delete(previous.r2_key);
        await db.prepare("DELETE FROM media WHERE id = ?").bind(previous.image_id).run();
      }
    } else if (kind === "service") {
      const targetId = String(form.get("targetId") ?? "");
      const service = (await readManagedContent()).repairServices.find((item) => item.id === targetId);
      if (!service) throw new Error("Непозната услуга.");
      const previous = await db.prepare(`SELECT repair_service_overrides.image_id, media.r2_key
        FROM repair_service_overrides LEFT JOIN media ON media.id = repair_service_overrides.image_id
        WHERE repair_service_overrides.id = ?`)
        .bind(targetId)
        .first<{ image_id: string | null; r2_key: string | null }>();
      await db.prepare(`INSERT INTO repair_service_overrides
        (id, icon, title, description, price, image_id, sort_order, active, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET image_id = excluded.image_id, active = 1, updated_at = CURRENT_TIMESTAMP`)
        .bind(targetId, service.icon, service.title, service.description, service.price, mediaId, service.sortOrder)
        .run();
      if (previous?.image_id && previous.r2_key) {
        await bucket.delete(previous.r2_key);
        await db.prepare("DELETE FROM media WHERE id = ?").bind(previous.image_id).run();
      }
    } else {
      const title = String(form.get("title") ?? "").trim();
      const category = String(form.get("category") ?? "").trim();
      if (!title || !allowedCategories.has(category)) throw new Error("Добавете заглавие и изберете раздел.");
      const id = `upload-${crypto.randomUUID()}`;
      const tone = category === "Ремонти" || category === "Завършени обекти" ? "stone" : "leaf";
      await db.prepare(`INSERT INTO gallery_uploads
        (id, category, title, image_id, tone, sort_order, active)
        VALUES (?, ?, ?, ?, ?, ?, 1)`)
        .bind(id, category, title, mediaId, tone, Date.now())
        .run();
    }
  } catch (error) {
    await bucket.delete(r2Key);
    await db.prepare("DELETE FROM media WHERE id = ?").bind(mediaId).run();
    const message = error instanceof Error ? error.message : "Снимката не може да бъде запазена.";
    return uploadError(message);
  }

  return Response.json({ ok: true }, { status: 201 });
}
