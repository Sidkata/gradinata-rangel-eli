import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const media = sqliteTable(
  "media",
  {
    id: text("id").primaryKey(),
    r2Key: text("r2_key").notNull(),
    filename: text("filename").notNull(),
    contentType: text("content_type").notNull(),
    size: integer("size").notNull(),
    uploadedBy: text("uploaded_by").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [uniqueIndex("idx_media_r2_key").on(table.r2Key)],
);

export const productOverrides = sqliteTable(
  "product_overrides",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    icon: text("icon").notNull(),
    status: text("status").notNull(),
    price: text("price"),
    imageId: text("image_id").references(() => media.id, { onDelete: "set null" }),
    sortOrder: integer("sort_order").notNull(),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("idx_product_overrides_sort_order").on(table.sortOrder)],
);

export const repairServiceOverrides = sqliteTable(
  "repair_service_overrides",
  {
    id: text("id").primaryKey(),
    icon: text("icon").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    price: text("price"),
    imageId: text("image_id").references(() => media.id, { onDelete: "set null" }),
    sortOrder: integer("sort_order").notNull(),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("idx_repair_service_overrides_active_sort").on(table.active, table.sortOrder)],
);

export const galleryUploads = sqliteTable(
  "gallery_uploads",
  {
    id: text("id").primaryKey(),
    category: text("category").notNull(),
    title: text("title").notNull(),
    imageId: text("image_id").notNull().references(() => media.id, { onDelete: "cascade" }),
    tone: text("tone").notNull().default("leaf"),
    sortOrder: integer("sort_order").notNull(),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("idx_gallery_uploads_category_active_sort").on(table.category, table.active, table.sortOrder)],
);
