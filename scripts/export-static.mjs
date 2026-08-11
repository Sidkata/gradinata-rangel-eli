import { access, copyFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const clientRoot = resolve(projectRoot, "dist/client");
const workerPath = resolve(projectRoot, "dist/server/index.js");

await access(workerPath);
const { default: worker } = await import(`${new URL(`file://${workerPath}`).href}?static-export=${Date.now()}`);

const assets = {
  fetch: async () => new Response("Not found", { status: 404 }),
};

async function render(pathname, outputPath) {
  const response = await worker.fetch(
    new Request(`https://gradinata-rangel-eli.pages.dev${pathname}`, {
      headers: { accept: pathname === "/" ? "text/html" : "text/plain" },
    }),
    { ASSETS: assets },
    { waitUntil() {}, passThroughOnException() {} },
  );

  if (!response.ok) {
    throw new Error(`Static export failed for ${pathname}: ${response.status}`);
  }

  const destination = resolve(clientRoot, outputPath);
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, await response.text());
}

await render("/", "index.html");
await render("/robots.txt", "robots.txt");
await render("/sitemap.xml", "sitemap.xml");
await copyFile(resolve(clientRoot, "index.html"), resolve(clientRoot, "404.html"));

console.log("Static Cloudflare Pages output created in dist/client");
