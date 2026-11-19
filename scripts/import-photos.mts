// Turns the photographer's files into the web-sized photos the site uses.
//   npx tsx scripts/import-photos.mts <folder-with-the-downloaded-originals>
// For every entry in src/lib/photos.ts it finds the original (lestrebaldie-web-<N>.JPG), resizes to at most 1800 px wide,
// compresses, and writes public/img/photos/<category>-<NNN>.jpg. Originals are only read, never modified.
import { existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { CATALOG } from "../src/lib/photos";

const input = process.argv[2];
if (!input || !existsSync(input)) { console.error("Usage: npx tsx scripts/import-photos.mts <folder>"); process.exit(1); }
const out = path.join(process.cwd(), "public", "img", "photos");
mkdirSync(out, { recursive: true });

// photos that are not part of the numbered "web" series
const SPECIAL: Record<string, string> = {
  "outdoor-200": "18042025-IMG_7385.jpg",
};
const files = readdirSync(input);
let total = 0;
const missing: string[] = [];
for (const p of CATALOG) {
  const base = path.basename(p.src, ".jpg");
  const n = Number(base.split("-")[1]);
  const name = SPECIAL[base] ?? files.find((f) => f.toLowerCase() === `lestrebaldie-web-${n}.jpg`);
  if (!name || !existsSync(path.join(input, name))) { missing.push(base); continue; }
  const dest = path.join(out, `${base}.jpg`);
  await sharp(path.join(input, name)).rotate().resize({ width: 1800, withoutEnlargement: true }).jpeg({ quality: 76, mozjpeg: true }).toFile(dest);
  total += statSync(dest).size;
}
console.log(`${CATALOG.length - missing.length}/${CATALOG.length} photos written to public/img/photos (${(total / 1e6).toFixed(1)} MB)${missing.length ? ", MISSING: " + missing.join(", ") : ""}`);
