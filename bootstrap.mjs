import {
  cpSync,
  copyFileSync,
  existsSync,
  readdirSync,
  readFileSync,
  writeFileSync
} from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const sourceDirectory = path.join(root, ".powernow");
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
  ["-xJf", archivePath, "-C", root],
  { stdio: "inherit" }
);

if (result.status !== 0) {
  throw new Error("Power NOW source extraction failed.");
}

function copyOverlay(sourcePath, destinationPath) {
  const source = path.join(root, sourcePath);
  if (!existsSync(source)) return;
  cpSync(source, path.join(root, destinationPath), {
    recursive: true,
    force: true
  });
}

copyOverlay("inspection-series/app", "app");
copyOverlay("inspection-series/components", "components");
copyOverlay("inspection-series/src/lib", "src/lib");

const multiBookOrders = path.join(
  root,
  "inspection-series-operational/src/lib/orders.ts"
);
if (existsSync(multiBookOrders)) {
  copyFileSync(multiBookOrders, path.join(root, "src/lib/orders.ts"));
}

console.log(
  "Materialized Power NOW storefront source with multi-book series overlays."
);
