import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { buildFallbackHistory, limitHistoryToElapsedTime } from "../src/utils/sensorHistory.js";

test("builds the production AgriSmart shell", async () => {
  const html = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
  assert.match(html, /<html[^>]+data-theme="dark"/i);
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

test("limits today's sensor history to elapsed hours", () => {
  const fullDay = buildFallbackHistory("soilMoisture", 42, "2026-08-19");
  const elapsed = limitHistoryToElapsedTime(fullDay, true, new Date("2026-08-19T15:23:00"));
  assert.equal(fullDay.length, 24);
  assert.equal(elapsed.length, 16);
  assert.equal(elapsed.at(-1).hour, "15:00");
  assert.equal(limitHistoryToElapsedTime(fullDay, false).length, 24);
});
