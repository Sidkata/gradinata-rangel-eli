import { galleryItems as defaultGallery, products as defaultProducts, repairServices as defaultRepairServices, type ProductStatus } from "../data/site";
import { requireDatabase } from "./bindings";

export type ManagedProduct = {
  id: string;
  name: string;
  icon: string;
  description: string;
  status: ProductStatus;
  price: string | null;
  image: string | null;
  sortOrder: number;
  custom: boolean;
};

export type ManagedRepairService = {
  id: string;
  icon: string;
  title: string;
  description: string;
  price: string | null;
  image: string | null;
  sortOrder: number;
  custom: boolean;
};

export type ManagedGalleryItem = {
  id: string;
  category: string;
  icon: string;
  title: string;
  image: string | null;
  tone: "leaf" | "sun" | "earth" | "stone";
  placeholder: string;
  custom: boolean;
};

type ProductRow = {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: ProductStatus;
  price: string | null;
  image_id: string | null;
  sort_order: number;
  active: number;
};

type RepairServiceRow = {
  id: string;
  icon: string;
  title: string;
  description: string;
  price: string | null;
  image_id: string | null;
  sort_order: number;
  active: number;
};

type GalleryRow = {
  id: string;
  category: string;
  title: string;
  image_id: string;
  tone: "leaf" | "sun" | "earth" | "stone";
  sort_order: number;
};

let schemaReady: Promise<void> | null = null;

export function productId(index: number): string {
  return `product-${index + 1}`;
}

export function repairServiceId(index: number): string {
  return `service-${index + 1}`;
}

export async function ensureContentSchema(): Promise<void> {
  if (schemaReady) return schemaReady;
  const db = requireDatabase();
  schemaReady = (async () => {
    await db.batch([
      db.prepare(`CREATE TABLE IF NOT EXISTS media (
        id TEXT PRIMARY KEY NOT NULL,
        r2_key TEXT NOT NULL,
        filename TEXT NOT NULL,
        content_type TEXT NOT NULL,
        size INTEGER NOT NULL,
        uploaded_by TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
      )`),
      db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_media_r2_key ON media (r2_key)"),
      db.prepare(`CREATE TABLE IF NOT EXISTS product_overrides (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        icon TEXT NOT NULL,
        status TEXT NOT NULL,
        price TEXT,
        image_id TEXT,
        sort_order INTEGER NOT NULL,
        active INTEGER DEFAULT 1 NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        FOREIGN KEY (image_id) REFERENCES media(id) ON UPDATE NO ACTION ON DELETE SET NULL
      )`),
      db.prepare("CREATE INDEX IF NOT EXISTS idx_product_overrides_sort_order ON product_overrides (sort_order)"),
      db.prepare(`CREATE TABLE IF NOT EXISTS repair_service_overrides (
        id TEXT PRIMARY KEY NOT NULL,
        icon TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        price TEXT,
        image_id TEXT,
        sort_order INTEGER NOT NULL,
        active INTEGER DEFAULT 1 NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        FOREIGN KEY (image_id) REFERENCES media(id) ON UPDATE NO ACTION ON DELETE SET NULL
      )`),
      db.prepare("CREATE INDEX IF NOT EXISTS idx_repair_service_overrides_active_sort ON repair_service_overrides (active, sort_order)"),
      db.prepare(`CREATE TABLE IF NOT EXISTS gallery_uploads (
        id TEXT PRIMARY KEY NOT NULL,
        category TEXT NOT NULL,
        title TEXT NOT NULL,
        image_id TEXT NOT NULL,
        tone TEXT DEFAULT 'leaf' NOT NULL,
        sort_order INTEGER NOT NULL,
        active INTEGER DEFAULT 1 NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        FOREIGN KEY (image_id) REFERENCES media(id) ON UPDATE NO ACTION ON DELETE CASCADE
      )`),
      db.prepare("CREATE INDEX IF NOT EXISTS idx_gallery_uploads_category_active_sort ON gallery_uploads (category, active, sort_order)"),
    ]);
    const productColumns = await db.prepare("PRAGMA table_info(product_overrides)").all<{ name: string }>();
    if (!productColumns.results.some((column) => column.name === "active")) {
      await db.prepare("ALTER TABLE product_overrides ADD COLUMN active INTEGER DEFAULT 1 NOT NULL").run();
    }
    if (!productColumns.results.some((column) => column.name === "price")) {
      await db.prepare("ALTER TABLE product_overrides ADD COLUMN price TEXT").run();
    }
    const serviceColumns = await db.prepare("PRAGMA table_info(repair_service_overrides)").all<{ name: string }>();
    if (!serviceColumns.results.some((column) => column.name === "price")) {
      await db.prepare("ALTER TABLE repair_service_overrides ADD COLUMN price TEXT").run();
    }
    if (!serviceColumns.results.some((column) => column.name === "image_id")) {
      await db.prepare("ALTER TABLE repair_service_overrides ADD COLUMN image_id TEXT REFERENCES media(id) ON DELETE SET NULL").run();
    }
    await db.prepare("PRAGMA optimize").run();
  })().catch((error) => {
    schemaReady = null;
    throw error;
  });
  return schemaReady;
}

function mediaUrl(imageId: string | null): string | null {
  return imageId ? `/api/media/${encodeURIComponent(imageId)}` : null;
}

export async function readManagedContent(): Promise<{
  products: ManagedProduct[];
  repairServices: ManagedRepairService[];
  galleryItems: ManagedGalleryItem[];
}> {
  await ensureContentSchema();
  const db = requireDatabase();
  const [productResult, serviceResult, galleryResult] = await Promise.all([
    db.prepare("SELECT id, name, description, icon, status, price, image_id, sort_order, active FROM product_overrides ORDER BY sort_order ASC").all<ProductRow>(),
    db.prepare("SELECT id, icon, title, description, price, image_id, sort_order, active FROM repair_service_overrides ORDER BY sort_order ASC").all<RepairServiceRow>(),
    db.prepare("SELECT id, category, title, image_id, tone, sort_order FROM gallery_uploads WHERE active = 1 ORDER BY sort_order ASC, created_at DESC").all<GalleryRow>(),
  ]);

  const overrides = new Map(productResult.results.map((row) => [row.id, row]));
  const defaultProductIds = new Set(defaultProducts.map((_, index) => productId(index)));
  const products: ManagedProduct[] = defaultProducts.flatMap((product, index) => {
    const id = productId(index);
    const override = overrides.get(id);
    if (override?.active === 0) return [];
    return [{
      id,
      name: override?.name ?? product.name,
      description: override?.description ?? product.description,
      icon: override?.icon ?? product.icon,
      status: override?.status ?? product.status,
      price: override?.price ?? null,
      image: override?.image_id ? mediaUrl(override.image_id) : product.image,
      sortOrder: override?.sort_order ?? index,
      custom: false,
    }];
  });
  for (const row of productResult.results) {
    if (defaultProductIds.has(row.id) || row.active === 0) continue;
    products.push({
      id: row.id,
      name: row.name,
      description: row.description,
      icon: row.icon,
      status: row.status,
      price: row.price,
      image: mediaUrl(row.image_id),
      sortOrder: row.sort_order,
      custom: true,
    });
  }
  products.sort((a, b) => a.sortOrder - b.sortOrder);

  const serviceOverrides = new Map(serviceResult.results.map((row) => [row.id, row]));
  const defaultServiceIds = new Set(defaultRepairServices.map((_, index) => repairServiceId(index)));
  const repairServices: ManagedRepairService[] = defaultRepairServices.flatMap((service, index) => {
    const id = repairServiceId(index);
    const override = serviceOverrides.get(id);
    if (override?.active === 0) return [];
    return [{
      id,
      icon: override?.icon ?? service.icon,
      title: override?.title ?? service.title,
      description: override?.description ?? service.description,
      price: override?.price ?? null,
      image: mediaUrl(override?.image_id ?? null),
      sortOrder: override?.sort_order ?? index,
      custom: false,
    }];
  });
  for (const row of serviceResult.results) {
    if (defaultServiceIds.has(row.id) || row.active === 0) continue;
    repairServices.push({
      id: row.id,
      icon: row.icon,
      title: row.title,
      description: row.description,
      price: row.price,
      image: mediaUrl(row.image_id),
      sortOrder: row.sort_order,
      custom: true,
    });
  }
  repairServices.sort((a, b) => a.sortOrder - b.sortOrder);

  const galleryItems: ManagedGalleryItem[] = [
    ...defaultGallery.map((item) => ({ ...item, custom: false })),
    ...galleryResult.results.map((item) => ({
      id: item.id,
      category: item.category,
      icon: item.category === "Ремонти" || item.category === "Завършени обекти" ? "🔨" : "🌱",
      title: item.title,
      image: mediaUrl(item.image_id),
      tone: item.tone,
      placeholder: "Качена снимка",
      custom: true,
    })),
  ];

  return { products, repairServices, galleryItems };
}
