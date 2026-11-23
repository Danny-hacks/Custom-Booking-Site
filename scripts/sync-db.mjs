// Runs during the production build on Vercel, so the live database always matches the code that is being deployed:
//   1. prisma db push   adds new tables and columns (it refuses, and fails the build, if a change would delete data)
//   2. seed-posts       adds the starter guides, only while there are none
// It does nothing locally, on preview deployments, or when DATABASE_URL is a local SQLite file, so it cannot touch a database by accident.
import { execSync } from "node:child_process";

const url = process.env.DATABASE_URL ?? "";
if (process.env.VERCEL_ENV !== "production" || !url || url.startsWith("file:")) {
  console.log("[sync-db] skipped (only runs for production deployments with a Postgres DATABASE_URL)");
  process.exit(0);
}

const run = (cmd) => {
  console.log(`[sync-db] ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
};
run("npx prisma db push --skip-generate");
run("npx tsx scripts/seed-posts.mts");
console.log("[sync-db] database is in sync");
