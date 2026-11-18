// Picks the Prisma database provider from DATABASE_URL, so one schema serves every environment:
//   file:./dev.db            -> sqlite      (zero-setup local development)
//   postgresql://...         -> postgresql  (Vercel + Neon/Supabase, Google Cloud SQL, any Postgres)
// Runs before dev/build/install and regenerates the Prisma client only when the provider actually changed.
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
let url = process.env.DATABASE_URL ?? "";
if (!url && existsSync(new URL(".env", root))) {
  const m = readFileSync(new URL(".env", root), "utf8").match(/^DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/m);
  url = m?.[1] ?? "";
}
if (!url) {
  console.log("[prisma-provider] DATABASE_URL not set: leaving the schema as is");
  process.exit(0);
}

const wanted = url.startsWith("file:") ? "sqlite" : "postgresql";
const schemaPath = new URL("prisma/schema.prisma", root);
const schema = readFileSync(schemaPath, "utf8");
const current = schema.match(/datasource db \{[^}]*provider\s*=\s*"(\w+)"/)?.[1];

if (current === wanted) {
  console.log(`[prisma-provider] ${wanted} (unchanged)`);
} else {
  writeFileSync(schemaPath, schema.replace(/(datasource db \{[^}]*provider\s*=\s*")\w+(")/, `$1${wanted}$2`));
  console.log(`[prisma-provider] ${current} -> ${wanted}, regenerating the client`);
  execSync("npx prisma generate", { stdio: "inherit", cwd: new URL(".", root) });
}
