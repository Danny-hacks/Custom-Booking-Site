// Guest writes a review -> it is hidden -> owner approves it -> it is public. Dev server on :3000.
//   node --env-file=.env scripts/e2e-reviews.mjs
import { spawn } from "node:child_process";
import { SignJWT } from "jose";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const key = new TextEncoder().encode(process.env.SESSION_SECRET ?? "dev-secret");
const jwt = async (email) => new SignJWT({ uid: (await db.user.findUnique({ where: { email } })).id }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("1h").sign(key);
const day = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
const prop = await db.property.findFirst();
const guest = await db.user.findUnique({ where: { email: "guest@example.com" } });
const REF = "RVTEST", TEXT = "Automated test review: lovely stay, the pool and the stove were perfect.";
const clean = async () => { await db.review.deleteMany({ where: { textEn: TEXT } }); await db.booking.deleteMany({ where: { ref: REF } }); };
await clean();
await db.booking.create({ data: { ref: REF, propertyId: prop.id, userId: guest.id, guestName: guest.name, guestEmail: guest.email, checkIn: day(-30), checkOut: day(-25), nights: 5, source: "direct", status: "confirmed", total: 100000 } });
const tokens = { guest: await jwt("guest@example.com"), admin: await jwt(process.env.ADMIN_EMAIL) };

const port = 9341;
const edge = spawn("C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", ["--headless=new", "--disable-gpu", `--remote-debugging-port=${port}`, "--user-data-dir=" + process.env.TEMP + "/lb-rev-profile", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target; for (let i = 0; i < 40 && !target; i++) { try { target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json(); } catch { await sleep(300); } }
const ws = new WebSocket(target.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
let id = 0; const pend = new Map();
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d.result ?? d.error); pend.delete(d.id); } };
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (e) => (await send("Runtime.evaluate", { expression: e, returnByValue: true })).result?.value;
const step = (ok, msg) => { console.log(`${ok ? "PASS" : "FAIL"} ${msg}`); if (!ok) process.exitCode = 1; };
const go = async (url, as) => { await send("Network.clearBrowserCookies"); if (as) await send("Network.setCookie", { name: "lb_session", value: tokens[as], url: "http://localhost:3000" }); await send("Page.navigate", { url }); await sleep(5000); };
await send("Page.enable"); await send("Network.enable");

await go("http://localhost:3000/en/account", "guest");
step(await ev(`!!document.querySelector('#stay-${REF} textarea[name=text]')`), "guest sees the review form on a finished stay");
await ev(`(()=>{const f=document.querySelector('#stay-${REF} form');f.querySelector('textarea').value=${JSON.stringify(TEXT)};f.querySelector('label[for="r-${REF}-4"]').click();f.requestSubmit()})()`);
await sleep(5000);
let r = await db.review.findFirst({ where: { textEn: TEXT } });
step(r?.status === "pending" && r.published === false && r.rating === 4 && r.userId === guest.id && r.bookingId, `review saved as pending, 4 stars, linked to the stay (${r?.status}, ${r?.rating}, name "${r?.name}")`);
step((await ev(`document.querySelector('#stay-${REF}').innerText`)).includes("approved it"), "guest sees the 'will appear once approved' message");
step(!(await ev(`!!document.querySelector('#stay-${REF} textarea')`)), "form is gone, one review per stay");
step((await db.notification.count({ where: { subject: { contains: "New review to approve" } } })) > 0, "owner was notified");

await go("http://localhost:3000/en/reviews");
step(!(await ev(`document.body.innerText.includes("Automated test review")`)), "pending review is NOT public");
step((await ev(`document.body.innerText.includes("Claire M.")`)), "placeholder testimonials are on the public reviews page");

await go("http://localhost:3000/admin/reviews", "admin");
step((await ev(`document.body.innerText.includes("Waiting for your approval")`)), "admin sees it in the approval queue");
await ev(`[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Approve and publish')).click()`);
await sleep(3500);
r = await db.review.findFirst({ where: { textEn: TEXT } });
step(r?.status === "approved" && r.published, "approving publishes it");

await go("http://localhost:3000/en/reviews");
step((await ev(`document.body.innerText.includes("Automated test review")`)), "approved review is now public");
await clean(); await db.$disconnect(); ws.close(); edge.kill();
process.exit(process.exitCode ?? 0);
