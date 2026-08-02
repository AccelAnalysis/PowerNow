import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const sourceDirectory = path.join(process.cwd(), ".powernow");
const partNames = readdirSync(sourceDirectory)
  .filter((name) => /^part\d+$/.test(name))
  .sort();

if (!partNames.length) {
  throw new Error("Power NOW source bundle is missing.");
}

const encoded = partNames
  .map((name) => readFileSync(path.join(sourceDirectory, name), "utf8"))
  .join("");
const archivePath = path.join("/tmp", "powernow-source.tar.xz");
writeFileSync(archivePath, Buffer.from(encoded, "base64"));

const result = spawnSync(
  "tar",
  ["-xJf", archivePath, "-C", process.cwd()],
  { stdio: "inherit" }
);

if (result.status !== 0) {
  throw new Error("Power NOW source extraction failed.");
}

console.log("Materialized Power NOW storefront source (2d813cbca6e4).");
