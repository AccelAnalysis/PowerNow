import { promises as fs } from "node:fs";
import path from "node:path";

const root = process.cwd();
const blocked = [
  "$24.95 for one",
  "24.95 today",
  "total today",
  "landed total",
  "one copy · quantity"
];

const extensions = new Set([".ts", ".tsx", ".js", ".mjs", ".json", ".md"]);
const ignored = new Set(["node_modules", ".next", ".git"]);

async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const paths = [];
  for (const entry of entries) {
    if (ignored.has(entry.name)) continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) paths.push(...(await walk(full)));
    else if (extensions.has(path.extname(entry.name))) paths.push(full);
  }
  return paths;
}

const violations = [];
for (const file of await walk(root)) {
  if (file.endsWith("scripts/check-pricing-language.mjs")) continue;
  const text = await fs.readFile(file, "utf8");
  for (const phrase of blocked) {
    if (text.toLowerCase().includes(phrase.toLowerCase())) {
      violations.push(`${path.relative(root, file)} contains "${phrase}"`);
    }
  }
}

if (violations.length) {
  console.error("Misleading combined-price language found:\n" + violations.join("\n"));
  process.exit(1);
}

console.log("Pricing language check passed.");
