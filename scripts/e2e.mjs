// End-to-end guest journey in a real (headless) browser at phone width: checkout -> demo pay -> confirmation.
// Needs the dev server on :3000 in demo-payment mode. Creates one booking named "E2E Guest" (see clean-test-data.mts).
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";

const OUT = process.argv[2];
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const port = 9334;
const edge = spawn(EDGE, ["--headless=new", "--disable-gpu", `--remote-debugging-port=${port}`, "--user-data-dir=" + process.env.TEMP + "/lb-e2e-profile", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 40 && !target; i++) { try { target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json(); } catch { await sleep(300); } }
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map();
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d.result ?? d.error); pending.delete(d.id); } };
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => (await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true })).result?.value;
const shot = async (name) => {
  const h = await ev("Math.ceil(document.documentElement.scrollHeight)");
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: Math.min(h, 4000), deviceScaleFactor: 1, mobile: true });
  await sleep(500);
  writeFileSync(`${OUT}/e2e-${name}.png`, Buffer.from((await send("Page.captureScreenshot", { format: "png" })).data, "base64"));
};
const step = (ok, msg) => console.log(`${ok ? "PASS" : "FAIL"} ${msg}`);

await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 900, deviceScaleFactor: 1, mobile: true });
await send("Page.addScriptToEvaluateOnNewDocument", { source: "const st=window.setTimeout;window.setTimeout=(f,t,...a)=>st(f,t===5000?9e8:t,...a);" });

const q = "slug=la-bastide-de-lestrebaldie&from=2027-03-08&to=2027-03-11&adults=4&children=0&pets=0&code=BIENVENUE15";
await send("Page.navigate", { url: `http://localhost:3000/fr/book?${q}` });
await sleep(2500);
step((await ev("document.body.innerText")).includes("BIENVENUE") || (await ev("document.body.innerText")).includes("Offre de bienvenue"), "checkout (FR) shows the welcome offer discount");
await ev(`(()=>{const set=(n,v)=>{const e=document.querySelector('[name='+n+']');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}))};set('name','E2E Guest');set('email','e2e@example.com');set('phone','+33600000000');document.querySelector('form').requestSubmit();})()`);
await sleep(4000);
const payUrl = await ev("location.pathname");
step(payUrl.startsWith("/fr/pay/"), `submitting checkout lands on the pay page (${payUrl})`);
await shot("pay");
await ev(`document.querySelector('form button').click()`);
await sleep(4000);
const done = await ev("location.pathname");
step(done.startsWith("/fr/book/confirmed/"), `demo payment lands on the confirmation page (${done})`);
const txt = await ev("document.body.innerText");
step(/confirm/i.test(txt), "confirmation page says the booking is confirmed");
await shot("confirmed");
ws.close(); edge.kill(); process.exit(0);
