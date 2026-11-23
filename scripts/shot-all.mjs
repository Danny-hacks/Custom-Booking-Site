import { spawn } from "node:child_process";import fs from "node:fs";
const out=process.argv[2];const port=9353;const edge=spawn("C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",["--headless=new","--disable-gpu",`--remote-debugging-port=${port}`,"--user-data-dir="+process.env.TEMP+"/lb-sa","about:blank"],{stdio:"ignore"});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let t;for(let i=0;i<40&&!t;i++){try{t=await(await fetch(`http://127.0.0.1:${port}/json/new?about:blank`,{method:"PUT"})).json()}catch{await sleep(300)}}
const ws=new WebSocket(t.webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);let id=0;const p=new Map();ws.onmessage=m=>{const d=JSON.parse(m.data);if(d.id&&p.has(d.id)){p.get(d.id)(d.result);p.delete(d.id)}};
const send=(method,params={})=>new Promise(r=>{const i=++id;p.set(i,r);ws.send(JSON.stringify({id:i,method,params}))});
const ev=e=>send("Runtime.evaluate",{expression:e,returnByValue:true,awaitPromise:true});
await send("Emulation.setDeviceMetricsOverride",{width:390,height:844,deviceScaleFactor:1,mobile:true});
for(const x of process.argv.slice(3)){
 await send("Page.navigate",{url:`http://localhost:3000/en${x}`});await sleep(3500);
 await ev(`[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Maybe later'))?.click()`);
 // scroll through to trigger reveals
 await ev(`(async()=>{for(let y=0;y<document.body.scrollHeight;y+=500){scrollTo(0,y);await new Promise(r=>setTimeout(r,120))}scrollTo(0,0)})()`);await ev(`[...document.querySelectorAll("body *")].filter(e=>getComputedStyle(e).position==="fixed"&&(e.getAttribute("role")==="dialog"||e.className.toString().includes("inset-0")||e.className.toString().includes("backdrop"))).forEach(e=>e.remove())`);await sleep(5000);await ev(`document.querySelectorAll("dialog").forEach(d=>d.close())`);await sleep(600);
 const h=(await ev(`document.documentElement.scrollHeight`)).result.value;
 const n=1;
 for(let i=0;i<n;i++){const s=await send("Page.captureScreenshot",{format:"jpeg",quality:70,captureBeyondViewport:true,clip:{x:0,y:i*1000,width:390,height:Math.min(1000,h-i*1000),scale:0.7}});
  fs.writeFileSync(`${out}/${x.replace(/\//g,"_")||"_home"}-${i}.jpg`,Buffer.from(s.data,"base64"));}
 console.log(x||"/",h,n);
}
ws.close();edge.kill();process.exit(0);
