// The app marks server code with `import "server-only"`, which throws outside Next.js. The test scripts under
// scripts/ import that code directly, so we provide an empty stand-in when the package is not installed.
// Next.js itself ignores this folder (it has its own copy), so the app is unaffected.
import { existsSync, mkdirSync, writeFileSync } from "node:fs";

const dir = new URL("../node_modules/server-only/", import.meta.url);
if (!existsSync(dir)) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(new URL("package.json", dir), JSON.stringify({ name: "server-only", version: "0.0.0-stub", main: "index.js" }));
  writeFileSync(new URL("index.js", dir), "");
}
