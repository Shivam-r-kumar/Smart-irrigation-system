import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { buildFallbackHistory, limitHistoryToElapsedTime } from "../src/utils/sensorHistory.js";
import { getSoilRemedies } from "../src/utils/soilRemedies.js";
import { calculatePolygonAreaAcres, isPointInsideBoundary, loadFarmDevices, saveFarmDevices } from "../src/utils/farmMapping.js";
import { buildFallbackWeather } from "../src/utils/weather.js";

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

test("opens reports from the dashboard instead of the sidebar", async () => {
  const navigation = JSON.parse(await readFile(new URL("../src/data/navigation.json", import.meta.url), "utf8"));
  const dashboardSource = await readFile(new URL("../src/pages/Dashboard.jsx", import.meta.url), "utf8");
  const reportModalSource = await readFile(new URL("../src/components/ReportModal.jsx", import.meta.url), "utf8");
  assert.ok(!navigation.some((item) => item.path === "/reports"));
  assert.match(dashboardSource, /dashboard-report-button/);
  assert.match(dashboardSource, /<ReportModal/);
  assert.match(reportModalSource, /aria-modal="true"/);
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
  const mapperSource = await readFile(new URL("../src/components/FarmMapperModal.jsx", import.meta.url), "utf8");
  const settingsSource = await readFile(new URL("../src/pages/Settings.jsx", import.meta.url), "utf8");
  const googleMapsSource = await readFile(new URL("../src/utils/googleMaps.js", import.meta.url), "utf8");
  const contextSource = await readFile(new URL("../src/context/FarmContext.jsx", import.meta.url), "utf8");
  const mappingServiceSource = await readFile(new URL("../src/firebase/mappingService.js", import.meta.url), "utf8");
  const sensorsSource = await readFile(new URL("../src/pages/Sensors.jsx", import.meta.url), "utf8");
  assert.ok(farmMap.boundary.length >= 3);
  assert.equal(farmMap.devices.length, 6);
  assert.ok(farmMap.devices.every((device) => Number.isFinite(device.coordinates.lat) && Number.isFinite(device.coordinates.lng)));
  assert.ok(farmMap.devices.every((device) => isPointInsideBoundary(device.coordinates, farmMap.boundary)));
  assert.ok(calculatePolygonAreaAcres(farmMap.boundary) > 1);
  assert.match(pageSource, /GOOGLE_MAPS_API_KEY/);
  assert.match(googleMapsSource, /VITE_GOOGLE_MAPS_API_KEY/);
  assert.match(pageSource, /MapTypeId\.SATELLITE/);
  assert.doesNotMatch(pageSource, /FarmMapperModal/);
  assert.match(settingsSource, /FarmMapperModal/);
  assert.match(settingsSource, /updateFarmMapping\(nextBoundary, nextDevices\)/);
  assert.match(contextSource, /saveFarmBoundary\(window\.localStorage, nextBoundary\)/);
  assert.match(contextSource, /saveFarmDevices\(window\.localStorage, nextDevices\)/);
  assert.match(contextSource, /subscribeToFarmMapping/);
  assert.match(contextSource, /saveSharedFarmMapping\(nextBoundary, nextDevices\)/);
  assert.match(mappingServiceSource, /farmMapping\/default/);
  assert.match(sensorsSource, /farmDevices/);
  assert.doesNotMatch(sensorsSource, /sensors\.json/);
  assert.doesNotMatch(pageSource, /Open in Google Maps|googleMapsUrl/);
  assert.match(mapperSource, /Sensor Node|Motor Control Unit|Gateway/);
  assert.match(mapperSource, /isPointInsideBoundary/);
  assert.match(mapperSource, /deleteDevice/);
  assert.doesNotMatch(pageSource, /farmZones|mappedZones|zone\.path/);
});

test("persists custom map devices safely", () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
  };
  const devices = [{ id: "SENSOR-001", coordinates: { lat: 30.9, lng: 75.85 } }];
  assert.equal(saveFarmDevices(storage, devices), true);
  assert.deepEqual(loadFarmDevices(storage, []), devices);
});

test("opens a complete farm weather intelligence page", async () => {
  const appSource = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
  const navbarSource = await readFile(new URL("../src/components/Navbar.jsx", import.meta.url), "utf8");
  const weatherSource = await readFile(new URL("../src/utils/weather.js", import.meta.url), "utf8");
  const weather = buildFallbackWeather(new Date("2026-08-19T12:00:00"));
  const today = weather.days[15].date;
  assert.match(appSource, /path="\/weather"/);
  assert.match(navbarSource, /className="weather" to="\/weather"/);
  assert.match(weatherSource, /past_days: "15"/);
  assert.match(weatherSource, /forecast_days: "16"/);
  assert.match(weatherSource, /seasonal-api\.open-meteo\.com/);
  assert.equal(weather.days.filter((day) => day.date < today).length, 15);
  assert.equal(weather.days.filter((day) => day.date > today).length, 15);
  assert.equal(weather.months.length, 6);
});
