import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("builds the production AgriSmart shell", async () => {
  const html = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
  assert.match(html, /AgriSmart — Smart Irrigation &(?:amp;)? Precision Farming/i);
  assert.match(html, /AgriSmart/);
  assert.match(html, /og\.png/);
  assert.match(html, /\/assets\/index-[^"']+\.js/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("configures Vercel fallback routing for application routes", async () => {
  const config = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));
  assert.equal(config.framework, "vite");
  assert.equal(config.outputDirectory, "dist");
  assert.deepEqual(config.rewrites, [{ source: "/(.*)", destination: "/index.html" }]);
});
