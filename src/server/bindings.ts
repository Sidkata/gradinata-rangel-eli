export type AppBindings = {
  DB?: D1Database;
  MEDIA?: R2Bucket;
  ADMIN_EMAILS?: string;
};

declare global {
  var __GRADINA_BINDINGS__: AppBindings | undefined;
}

export function setBindings(bindings: AppBindings): void {
  globalThis.__GRADINA_BINDINGS__ = bindings;
}

export function getBindings(): AppBindings {
  return globalThis.__GRADINA_BINDINGS__ ?? {};
}

export function requireDatabase(): D1Database {
  const database = getBindings().DB;
  if (!database) throw new Error("Липсва връзка с базата данни.");
  return database;
}

export function requireMediaBucket(): R2Bucket {
  const bucket = getBindings().MEDIA;
  if (!bucket) throw new Error("Липсва хранилище за снимки.");
  return bucket;
}
