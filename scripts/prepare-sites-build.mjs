import { copyFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const serverDirectory = fileURLToPath(new URL("../dist/server", import.meta.url));
const workerSource = fileURLToPath(new URL("../worker/static-site.js", import.meta.url));
const workerTarget = fileURLToPath(new URL("../dist/server/index.js", import.meta.url));

await mkdir(serverDirectory, { recursive: true });
await copyFile(workerSource, workerTarget);
console.log(`Prepared Sites worker for ${projectRoot}`);
