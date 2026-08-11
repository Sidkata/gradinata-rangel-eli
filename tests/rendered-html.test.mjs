import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("exports a complete Bulgarian static page", async () => {
  const html = await readFile(new URL("../dist/client/index.html", import.meta.url), "utf8");

  assert.match(html, /<html[^>]*lang="bg"/i);
  assert.match(html, /<title>Градината на Рангел и Ели \| Старо Железаре<\/title>/i);
  assert.match(html, /Домашна продукция от Старо Железаре/);
  assert.match(html, /Ремонти и/);
  assert.match(html, /Нашата продукция/);
  assert.match(html, /application\/ld\+json/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Starter Project/);
});

test("exports SEO and required image assets", async () => {
  const [robots, sitemap] = await Promise.all([
    readFile(new URL("../dist/client/robots.txt", import.meta.url), "utf8"),
    readFile(new URL("../dist/client/sitemap.xml", import.meta.url), "utf8"),
  ]);

  assert.match(robots, /User-Agent: \*/i);
  assert.match(robots, /Sitemap:/i);
  assert.match(sitemap, /gradinata-rangel-eli\.pages\.dev/);

  await Promise.all([
    access(new URL("../dist/client/favicon.png", import.meta.url)),
    access(new URL("../dist/client/og.png", import.meta.url)),
    access(new URL("../dist/client/404.html", import.meta.url)),
  ]);
});

test("keeps editable business data in one file", async () => {
  const data = await readFile(new URL("../src/data/site.ts", import.meta.url), "utf8");

  assert.match(data, /phoneHref: "\+359899960149"/);
  assert.match(data, /phoneHref: "\+359894646086"/);
  assert.match(data, /viber:\/\/chat\?number=%2B359899960149/);
  assert.match(data, /viber:\/\/chat\?number=%2B359894646086/);
  assert.match(data, /export const products/);
  assert.match(data, /export const repairServices/);
  assert.match(data, /export const galleryItems/);
});
