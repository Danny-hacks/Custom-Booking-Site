// Journal and things-to-do, in a real browser: public pages, owner writes and publishes an article, unsafe markup stays inert,
// plans and the activity filter on the Area page. Dev server on :3000.
//   node --env-file=.env scripts/e2e-journal.mjs
import { spawn } from "node:child_process";
import { SignJWT } from "jose";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const key = new TextEncoder().encode(process.env.SESSION_SECRET ?? "dev-secret");
const admin = await db.user.findUnique({ where: { email: process.env.ADMIN_EMAIL } });
const token = await new SignJWT({ uid: admin.id }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("1h").sign(key);
const TITLE = "E2E test article about swimming";
const clean = async () => { await db.post.deleteMany({ where: { titleEn: TITLE } }); };
await clean();

const port = 9344;
const edge = spawn("C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", ["--headless=new", "--disable-gpu", `--remote-debugging-port=${port}`, "--user-data-dir=" + process.env.TEMP + "/lb-journal-profile", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target; for (let i = 0; i < 40 && !target; i++) { try { target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json(); } catch { await sleep(300); } }
const ws = new WebSocket(target.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
let id = 0; const pend = new Map();
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d.result ?? d.error); pend.delete(d.id); } };
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (e) => (await send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true })).result?.value;
const step = (ok, msg) => { console.log(`${ok ? "PASS" : "FAIL"} ${msg}`); if (!ok) process.exitCode = 1; };
const go = async (url, as) => {
  await send("Network.clearBrowserCookies");
  if (as) await send("Network.setCookie", { name: "lb_session", value: token, url: "http://localhost:3000" });
  await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(5500);
};
await send("Page.enable"); await send("Network.enable"); await send("Runtime.enable");

// public journal
await go("http://localhost:3000/en/journal");
const cards = await ev(`document.querySelectorAll('main ul > li a[href^="/en/journal/"]').length`);
step(cards === 4, `journal lists the 4 starter articles (${cards})`);
await go("http://localhost:3000/en/journal/first-weekend-in-the-segala");
step((await ev(`document.querySelector('h1')?.textContent`)) === "A first weekend in the Ségala", "article page shows its title");
step((await ev(`document.querySelectorAll('article h2').length`)) === 3, "headings from the article text are rendered");
step((await ev(`document.querySelectorAll('article ul li').length`)) === 3, "bullet list is rendered");
step(await ev(`!!document.querySelector('article a[href="/en/area/naucelle"]')`), "inline link to a place page works");
step((await ev(`document.querySelectorAll('a[href^="/en/area/"]').length`)) >= 5, "places mentioned are listed under the article");
await go("http://localhost:3000/fr/journal/first-weekend-in-the-segala");
step((await ev(`document.querySelector('h1')?.textContent`)) === "Un premier week-end en Ségala", "French version of the article");
await go("http://localhost:3000/en/journal/does-not-exist");
step(/not found|404/i.test(await ev(`document.body.innerText`)), "unknown article shows the branded 404");

// home and navigation
await go("http://localhost:3000/en");
step(await ev(`document.body.innerText.includes("Ideas for your stay")`), "home page shows the latest articles");
step(await ev(`!!document.querySelector('header a[href="/en/journal"]')`), "Journal is in the header");
const sm = await (await fetch("http://localhost:3000/sitemap.xml")).text();
step(sm.includes("/en/journal/first-weekend-in-the-segala") && sm.includes("/fr/area/naucelle"), "sitemap lists articles and places");

// owner writes an article
await go("http://localhost:3000/admin/journal/new", true);
await ev(`(()=>{const f=document.querySelector('[name=titleEn]').form;const set=(n,v)=>{f.querySelector('[name="'+n+'"]').value=v};
set('titleEn',${JSON.stringify(TITLE)});set('excerptEn','A short summary.');
set('bodyEn',${JSON.stringify("## First heading\n\nHello **world** with <script>window.__pwned=1</script> and [bad](javascript:window.__pwned=1) and [good](https://example.com).\n\n- one\n- two")});
f.querySelector('input[value="naucelle"]').click();f.querySelector('input[name=published]').click();f.requestSubmit()})()`);
await sleep(5000);
const row = await db.post.findFirst({ where: { titleEn: TITLE } });
step(!!row && row.published && row.places === "naucelle" && row.slug === "e2e-test-article-about-swimming", `article saved and published (slug ${row?.slug})`);
await go("http://localhost:3000/admin/journal", true);
step((await ev(`document.body.innerText.includes(${JSON.stringify(TITLE)})`)), "admin list shows the article");

await go(`http://localhost:3000/en/journal/${row.slug}`);
step((await ev(`document.querySelector('h1')?.textContent`)) === TITLE, "new article is public");
step(!(await ev(`!!window.__pwned`)) && !(await ev(`!!document.querySelector('article script')`)), "script tag in the text stays inert");
step(await ev(`document.querySelector('article').innerText.includes('<script>')`), "markup is shown as plain text");
step(!(await ev(`!!document.querySelector('article a[href^="javascript"]')`)), "javascript: links are not turned into links");
step(await ev(`document.querySelector('article a[href="https://example.com"]')?.getAttribute('rel')==='noopener noreferrer'`), "external links open safely");

// unpublish hides it
await go("http://localhost:3000/admin/journal", true);
await ev(`[...document.querySelectorAll('li')].find(l=>l.innerText.includes(${JSON.stringify(TITLE)})).querySelector('form button').click()`);
await sleep(3500);
step((await db.post.findFirst({ where: { titleEn: TITLE } }))?.published === false, "unpublish works");
await go(`http://localhost:3000/en/journal/${row.slug}`);
step(/not found|404/i.test(await ev(`document.body.innerText`)), "unpublished article is hidden");

// things to do on the area page
await go("http://localhost:3000/en/area");
step((await ev(`document.querySelectorAll('section.band-dark ol').length`)) === 5, "5 ready-made day plans are shown");
await ev(`[...document.querySelectorAll('#places button')].find(b=>b.textContent==='Rainy day').click()`);
await sleep(400);
const rainy = await ev(`document.querySelectorAll('#places ul > li').length`);
step(rainy >= 4 && rainy <= 7, `"Rainy day" filter narrows the list (${rainy})`);
await ev(`[...document.querySelectorAll('#places button')].find(b=>b.textContent==='Villages & towns').click()`);
await sleep(400);
const both = await ev(`document.querySelectorAll('#places ul > li').length`);
step(both >= 1 && both < rainy, `activity and type filters combine (${both})`);
await ev(`[...document.querySelectorAll('#places button')].find(b=>b.textContent==='Food & markets').click()`);
await sleep(400);
step((await ev(`document.querySelectorAll('#places ul > li').length`)) === 0 && (await ev(`document.body.innerText.includes('Nothing matches both choices')`)), "a combination with no match shows a helpful message");

await clean(); await db.$disconnect(); ws.close(); edge.kill();
process.exit(process.exitCode ?? 0);
