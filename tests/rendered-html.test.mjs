import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { buildFallbackHistory, limitHistoryToElapsedTime } from "../src/utils/sensorHistory.js";
import { getSoilRemedies } from "../src/utils/soilRemedies.js";
import { calculatePolygonAreaAcres } from "../src/utils/farmMapping.js";

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

test("models realistic daily field conditions", () => {
  const moisture = buildFallbackHistory("soilMoisture", 42, "2026-08-12");
  const temperature = buildFallbackHistory("temperature", 31, "2026-08-12");
  const humidity = buildFallbackHistory("humidity", 64, "2026-08-12");
  assert.ok(moisture[12].value < moisture[6].value);
  assert.ok(Math.abs(moisture[6].value - moisture[18].value) <= 3);
  assert.ok(temperature[12].value > temperature[6].value);
  assert.ok(humidity[12].value < humidity[6].value);
});

test("recommends remedies for low phosphorus and acidic soil", () => {
  const remedies = getSoilRemedies({ phosphorus: 60, soilPH: 6.5 });
  assert.deepEqual(remedies.map((remedy) => remedy.id), ["phosphorus", "acidity"]);
});

test("defines one farm boundary and coordinate-based Google map devices", async () => {
  const farmMap = JSON.parse(await readFile(new URL("../src/data/farmMap.json", import.meta.url), "utf8"));
  const pageSource = await readFile(new URL("../src/pages/FarmMap.jsx", import.meta.url), "utf8");
  assert.ok(farmMap.boundary.length >= 3);
  assert.equal(farmMap.devices.length, 5);
  assert.ok(farmMap.devices.every((device) => Number.isFinite(device.coordinates.lat) && Number.isFinite(device.coordinates.lng)));
  assert.ok(calculatePolygonAreaAcres(farmMap.boundary) > 1);
  assert.match(pageSource, /VITE_GOOGLE_MAPS_API_KEY/);
  assert.match(pageSource, /MapTypeId\.SATELLITE/);
  assert.doesNotMatch(pageSource, /farmZones|mappedZones|zone\.path/);
});
