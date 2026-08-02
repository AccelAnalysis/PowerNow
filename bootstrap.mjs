import { appendFileSync, copyFileSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const parts = Array.from({ length: 9 }, (_, index) =>
  `.powernow-bootstrap/part${String(index).padStart(2, "0")}`
);

const encodedArchive = parts.map((path) => readFileSync(path, "utf8")).join("");
const archivePath = "/tmp/powernow-source.tar.xz";

writeFileSync(archivePath, Buffer.from(encodedArchive, "base64"));
execFileSync("tar", ["-xJf", archivePath, "-C", process.cwd()], { stdio: "inherit" });

copyFileSync("patches/checkout-route.ts", "app/api/checkout/route.ts");
copyFileSync("patches/mobile-buy-bar.tsx", "components/MobileBuyBar.tsx");

const refinementMarker = "/* Final mobile conversion refinements */";
const refinements = readFileSync("patches/mobile-refinements.css", "utf8");
const globalsPath = "app/globals.css";
const globals = readFileSync(globalsPath, "utf8");

if (!globals.includes(refinementMarker)) {
  appendFileSync(globalsPath, `\n${refinements}\n`);
}

console.log("Rehydrated the reviewed Power NOW storefront source and applied production refinements.");
