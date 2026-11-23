// The area guide in a real browser: map zoom, pin links, category filter, "jump to a place" dropdown, place page, 404, French. Dev server on :3000.
//   node scripts/e2e-area.mjs
import { spawn } from "node:child_process";

const port = 9343;
const edge = spawn("C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", ["--headless=new", "--disable-gpu", `--remote-debugging-port=${port}`, "--user-data-dir=" + process.env.TEMP + "/lb-area-profile", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target; for (let i = 0; i < 40 && !target; i++) { try { target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json(); } catch { await sleep(300); } }
const ws = new WebSocket(target.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
let id = 0; const pend = new Map();
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d.result ?? d.error); pend.delete(d.id); } };
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (e) => (await send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true })).result?.value;
const step = (ok, msg) => { console.log(`${ok ? "PASS" : "FAIL"} ${msg}`); if (!ok) process.exitCode = 1; };
const go = async (url, w = 1280) => {
  await send("Emulation.setDeviceMetricsOverride", { width: w, height: 900, deviceScaleFactor: 1, mobile: w < 500 });
  await send("Page.navigate", { url }); await sleep(5500);
};
await send("Page.enable"); await send("Runtime.enable");

await go("http://localhost:3000/en/area");
const pins = () => ev(`document.querySelectorAll('svg a.map-pin').length`);
const near = await pins();
step(near >= 8 && near <= 14, `close-by map shows the nearby places (${near} pins)`);
await ev(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Wider area').click()`);
await sleep(600);
const wide = await pins();
step(wide === 16, `wider area shows all 16 mapped places (${wide} pins)`);
step(await ev(`[...document.querySelectorAll('svg a.map-pin')].every(a=>/\\/en\\/area\\/[a-z-]+$/.test(a.getAttribute('href')))`), "every pin links to its place page");
const overlap = await ev(`(()=>{const t=[...document.querySelectorAll('svg a.map-pin text')].map(e=>e.getBoundingClientRect());let n=0;for(let i=0;i<t.length;i++)for(let j=i+1;j<t.length;j++){const a=t[i],b=t[j];if(a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1)n++}return n})()`);
step(overlap === 0, `no overlapping map labels in the wide view (${overlap} overlaps)`);

const total = await ev(`document.querySelectorAll('#places ul > li').length`);
step(total === 18, `the list has all 18 places (${total})`);
await ev(`[...document.querySelectorAll('#places button')].find(b=>b.textContent==='Food & markets').click()`);
await sleep(400);
const food = await ev(`document.querySelectorAll('#places ul > li').length`);
step(food === 1, `"Food & markets" filter narrows the list (${food})`);
await ev(`[...document.querySelectorAll('#places button')].find(b=>b.textContent==='All').click()`);

// dropdown: set the value the way a user's choice does (React listens for the native change event)
await ev(`(()=>{const s=document.querySelector('#places select');const set=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set;set.call(s,'naucelle');s.dispatchEvent(new Event('change',{bubbles:true}))})()`);
await sleep(5000);
step((await ev(`location.pathname`)) === "/en/area/naucelle", `dropdown jumps to the place page (${await ev("location.pathname")})`);
step((await ev(`document.querySelector('h1')?.textContent`)) === "Naucelle", "place page shows its title");
step(await ev(`!!document.querySelector('a[href="/en/area#places"]')`), "place page links back to the guide");

await go("http://localhost:3000/en/area/does-not-exist");
step((await ev(`document.body.innerText`)).includes("404") || (await ev(`document.title`)).toLowerCase().includes("not found") || (await ev(`document.body.innerText`)).toLowerCase().includes("not found") || (await ev(`document.body.innerText`)).toLowerCase().includes("introuvable"), "unknown place shows the branded 404");

await go("http://localhost:3000/fr/area/viaduc-du-viaur");
step((await ev(`document.body.innerText`)).includes("Bon à savoir"), "French place page renders");

await go("http://localhost:3000/en/area", 390);
step((await ev(`document.documentElement.scrollWidth <= window.innerWidth + 1`)), "no sideways scroll on a phone");
const px = await ev(`(()=>{const t=document.querySelector('svg a.map-pin text');const r=t.getBoundingClientRect();return Math.round(parseFloat(getComputedStyle(t).fontSize)*(r.width/t.getBBox().width))})()`);
step(px >= 10, `map labels are readable on a phone (~${px}px)`);

ws.close(); edge.kill();
process.exit(process.exitCode ?? 0);
