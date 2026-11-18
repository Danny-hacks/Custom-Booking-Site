// Phone navigation menu in a headless browser: opens, shows every link, navigates, closes with Escape, and is absent on desktop.
// Dev server on :3000 required.  node scripts/e2e-menu.mjs <out-dir>
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";

const OUT = process.argv[2];
const port = 9336;
const edge = spawn("C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", ["--headless=new", "--disable-gpu", `--remote-debugging-port=${port}`, "--user-data-dir=" + process.env.TEMP + "/lb-menu-profile", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 40 && !target; i++) { try { target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json(); } catch { await sleep(300); } }
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map();
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d.result ?? d.error); pending.delete(d.id); } };
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => (await send("Runtime.evaluate", { expression: expr, returnByValue: true })).result?.value;
const shot = async (name) => writeFileSync(`${OUT}/menu-${name}.png`, Buffer.from((await send("Page.captureScreenshot", { format: "png" })).data, "base64"));
const step = (ok, msg) => { console.log(`${ok ? "PASS" : "FAIL"} ${msg}`); if (!ok) process.exitCode = 1; };
const visible = (sel) => ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)return false;const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(e).visibility!=='hidden'})()`);

await send("Page.enable");
await send("Page.addScriptToEvaluateOnNewDocument", { source: "const st=window.setTimeout;window.setTimeout=(f,t,...a)=>st(f,t===5000?9e8:t,...a);" });

// phone
await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await send("Page.navigate", { url: "http://localhost:3000/en" });
await sleep(8000); // the dev server compiles on first visit
step(await visible('button[aria-label="Open menu"]'), "phone: hamburger button is visible");
step(!(await visible('header nav a[href$="/area"]')), "phone: desktop links are not crammed into the header");
await ev(`document.querySelector('button[aria-label="Open menu"]').click()`);
await sleep(900);
step(await ev(`document.querySelector('dialog.menu-sheet').open`), "phone: tapping it opens the menu");
step((await ev(`document.querySelector('button[aria-label="Open menu"]').getAttribute('aria-expanded')`)) === "true", "phone: button reports expanded");
const links = await ev(`[...document.querySelectorAll('dialog.menu-sheet a')].map(a=>a.textContent.trim().replace(/\\s+/g,' '))`);
console.log("   menu items:", JSON.stringify(links));
step(links.length >= 6, "phone: menu lists the pages, Reserve and account");
await shot("open-en");

// escape closes
await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
await sleep(500);
step(!(await ev(`document.querySelector('dialog.menu-sheet').open`)), "phone: Escape closes the menu");

// navigating through it
await ev(`document.querySelector('button[aria-label="Open menu"]').click()`);
await sleep(700);
await ev(`[...document.querySelectorAll('dialog.menu-sheet a')].find(a=>a.getAttribute('href').endsWith('/area')).click()`);
await sleep(2500);
step((await ev("location.pathname")) === "/en/area", "phone: choosing 'The area' goes there");
step(!(await ev(`document.querySelector('dialog.menu-sheet').open`)), "phone: and the menu closes");
await shot("after-nav");

// French
await send("Page.navigate", { url: "http://localhost:3000/fr" });
await sleep(3500);
await ev(`document.querySelector('button[aria-label="Ouvrir le menu"]').click()`);
await sleep(900);
step((await ev(`document.querySelector('dialog.menu-sheet').innerText`)).includes("La région"), "phone: French menu is translated");
await shot("open-fr");

// desktop: no hamburger
await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url: "http://localhost:3000/en" });
await sleep(3000);
step(!(await visible('button[aria-label="Open menu"]')), "desktop: no hamburger");
step(await visible('header nav a[href$="/area"]'), "desktop: normal links are shown");

ws.close(); edge.kill(); process.exit();
