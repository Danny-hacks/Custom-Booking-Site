// QA helper: full-page screenshots through Edge's DevTools protocol, with optional phone emulation and a
// signed-in session. Usage: node scripts/shot.mjs jobs.json   (jobs: [{url,out,w,as,popup}])
// Reports horizontal overflow, which is the usual mobile layout bug.
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { SignJWT } from "jose";
import { PrismaClient } from "@prisma/client";

const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const jobs = JSON.parse(readFileSync(process.argv[2], "utf8"));
const db = new PrismaClient();
const key = new TextEncoder().encode(process.env.SESSION_SECRET ?? "dev-secret");
const token = async (email) => {
  const u = await db.user.findUnique({ where: { email } });
  return new SignJWT({ uid: u.id }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("1d").sign(key);
};
const tokens = { admin: await token(process.env.ADMIN_EMAIL), guest: await token("guest@example.com") };
await db.$disconnect();

const port = 9333;
const edge = spawn(EDGE, ["--headless=new", "--disable-gpu", `--remote-debugging-port=${port}`, "--user-data-dir=" + process.env.TEMP + "/lb-shot-profile", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 40 && !target; i++) {
  try { target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json(); } catch { await sleep(300); }
}
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map(); const waiters = [];
ws.onmessage = (m) => {
  const d = JSON.parse(m.data);
  if (d.id && pending.has(d.id)) { pending.get(d.id)(d.result ?? d.error); pending.delete(d.id); }
  else if (d.method) waiters.splice(0).forEach((w) => w(d));
};
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => (await send("Runtime.evaluate", { expression: expr, returnByValue: true })).result?.value;
await send("Page.enable"); await send("Network.enable");

for (const j of jobs) {
  const w = j.w ?? 1280;
  await send("Emulation.setDeviceMetricsOverride", { width: w, height: 900, deviceScaleFactor: 1, mobile: w < 700 });
  await send("Network.clearBrowserCookies");
  if (j.as) await send("Network.setCookie", { name: "lb_session", value: tokens[j.as], url: new URL(j.url).origin });
  await send("Page.addScriptToEvaluateOnNewDocument", { source: j.popup ? "" : "const st=window.setTimeout;window.setTimeout=(f,t,...a)=>st(f,t===5000?9e8:t,...a);" });
  await send("Page.navigate", { url: j.url });
  await sleep(1800);
  for (let y = 0; y < 12000; y += 500) { if (await ev(`(window.scrollTo(0,${y}), ${y} > document.documentElement.scrollHeight)`)) break; await sleep(110); }
  await ev("window.scrollTo(0,0)");
  await sleep(j.popup ? 6000 : 1500);
  const h = await ev("Math.ceil(document.documentElement.scrollHeight)");
  const overflow = await ev("document.documentElement.scrollWidth - window.innerWidth");
  const wide = await ev(`[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>window.innerWidth+1&&getComputedStyle(e).position!=='fixed').slice(0,4).map(e=>e.tagName+'.'+String(e.className).slice(0,50)).join(' | ')`);
  await send("Emulation.setDeviceMetricsOverride", { width: w, height: Math.min(h, 9000), deviceScaleFactor: 1, mobile: w < 700 });
  await sleep(400);
  const shot = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(j.out, Buffer.from(shot.data, "base64"));
  console.log(`${j.url} @${w}: h=${h} overflowX=${overflow}${overflow > 0 ? " WIDE: " + wide : ""}`);
}
ws.close(); edge.kill();
process.exit(0);
