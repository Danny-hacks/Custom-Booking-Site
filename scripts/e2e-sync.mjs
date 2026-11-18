// Drives the admin "Calendar sync" page in a headless browser: opens it, connects the pretend Airbnb calendar,
// tests a link, syncs, and screenshots each state. Dev server on :3000 required.  node --env-file=.env scripts/e2e-sync.mjs <out-dir>
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import { SignJWT } from "jose";
import { PrismaClient } from "@prisma/client";

const OUT = process.argv[2];
const db = new PrismaClient();
const admin = await db.user.findUnique({ where: { email: process.env.ADMIN_EMAIL } });
const jwt = await new SignJWT({ uid: admin.id }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("1d").sign(new TextEncoder().encode(process.env.SESSION_SECRET ?? "dev-secret"));
const prop = await db.property.findFirstOrThrow();
const original = prop.icalImportUrl;
await db.$disconnect();

const port = 9335;
const edge = spawn("C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", ["--headless=new", "--disable-gpu", `--remote-debugging-port=${port}`, "--user-data-dir=" + process.env.TEMP + "/lb-sync-profile", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 40 && !target; i++) { try { target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json(); } catch { await sleep(300); } }
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map();
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d.result ?? d.error); pending.delete(d.id); } };
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => (await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true })).result?.value;
const shot = async (name, w = 1280) => {
  const h = await ev("Math.ceil(document.documentElement.scrollHeight)");
  await send("Emulation.setDeviceMetricsOverride", { width: w, height: Math.min(h, 5000), deviceScaleFactor: 1, mobile: w < 700 });
  await sleep(400);
  writeFileSync(`${OUT}/sync-${name}.png`, Buffer.from((await send("Page.captureScreenshot", { format: "png" })).data, "base64"));
};
const step = (ok, msg) => console.log(`${ok ? "PASS" : "FAIL"} ${msg}`);
const clickText = (txt) => ev(`(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim().includes(${JSON.stringify(txt)}));if(!b)return false;b.click();return true})()`);
const setUrl = (v) => ev(`(()=>{const e=document.getElementById('icalImportUrl');const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;set.call(e,${JSON.stringify(v)});e.dispatchEvent(new Event('input',{bubbles:true}))})()`);

await send("Page.enable"); await send("Network.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
await send("Network.setCookie", { name: "lb_session", value: jwt, url: "http://localhost:3000" });
const go = async (path) => { await send("Page.navigate", { url: "http://localhost:3000" + path }); await sleep(2500); };

try {
  await go("/admin/sync");
  step((await ev("document.body.innerText")).includes("Bring Airbnb"), "Calendar sync page opens");
  await shot("1-start");

  // dry-run test on a broken link: must fail clearly and save nothing
  await setUrl("http://localhost:3000/api/dev/airbnb-mock?broken=1");
  await clickText("Test this link first");
  await sleep(2500);
  step((await ev("document.body.innerText")).includes("did not return a calendar"), "a wrong link is explained in plain words");
  await shot("2-test-broken");

  // dry-run on the pretend calendar
  await setUrl("http://localhost:3000/api/dev/airbnb-mock");
  await clickText("Test this link first");
  await sleep(2500);
  const t = await ev("document.body.innerText");
  step(t.includes("The link works") && t.includes("Nothing was saved"), "a good link passes the test without saving");
  await shot("3-test-ok");

  // save + first sync
  await clickText("Save and sync now");
  await sleep(3500);
  const t2 = await ev("document.body.innerText");
  step(t2.includes("Saved. The first sync has run") && t2.includes("Working") && t2.includes("Airbnb reservation"), "save runs the first sync, status shows Working and the imported reservation");
  await shot("4-synced");
  await shot("5-mobile", 390);
} finally {
  const db2 = new PrismaClient();
  // leave the demo data as we found it: drop what the pretend Airbnb imported, restore the link and status
  await db2.booking.deleteMany({ where: { externalUid: { startsWith: "demo-" } } });
  await db2.property.update({ where: { id: prop.id }, data: { icalImportUrl: original, lastSyncAt: prop.lastSyncAt, lastSyncNote: prop.lastSyncNote } });
  await db2.$disconnect();
  ws.close(); edge.kill();
}
process.exit(0);
