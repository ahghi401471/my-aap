import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "..");
const repoRoot = resolve(appRoot, "..");
const distDir = resolve(appRoot, "dist");

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });

const tscBin = resolve(repoRoot, "node_modules", ".bin", process.platform === "win32" ? "tsc.cmd" : "tsc");
const result = spawnSync(tscBin, ["-p", resolve(appRoot, "tsconfig.json")], {
  cwd: repoRoot,
  stdio: "inherit"
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

await cp(resolve(appRoot, "index.html"), resolve(distDir, "index.html"));
await cp(resolve(appRoot, "styles.css"), resolve(distDir, "styles.css"));

console.log(`Private browser app compiled to ${distDir}`);
