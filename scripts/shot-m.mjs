import { spawn } from "node:child_process";import fs from "node:fs";
const port=9351;const edge=spawn("C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",["--headless=new","--disable-gpu",`--remote-debugging-port=${port}`,"--user-data-dir="+process.env.TEMP+"/lb-m","about:blank"],{stdio:"ignore"});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let t;for(let i=0;i<40&&!t;i++){try{t=await(await fetch(`http://127.0.0.1:${port}/json/new?about:blank`,{method:"PUT"})).json()}catch{await sleep(300)}}
const ws=new WebSocket(t.webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);let id=0;const p=new Map();ws.onmessage=m=>{const d=JSON.parse(m.data);if(d.id&&p.has(d.id)){p.get(d.id)(d.result);p.delete(d.id)}};
const send=(method,params={})=>new Promise(r=>{const i=++id;p.set(i,r);ws.send(JSON.stringify({id:i,method,params}))});
await send("Emulation.setDeviceMetricsOverride",{width:390,height:844,deviceScaleFactor:1,mobile:true});
await send("Page.navigate",{url:"http://localhost:3000/en/area#places"});await sleep(6000);
console.log((await send("Runtime.evaluate",{expression:"document.documentElement.scrollWidth+' '+innerWidth",returnByValue:true})).result.value);
await send("Runtime.evaluate",{expression:"[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Maybe later'))?.click();document.querySelector('#places').scrollIntoView()"});await sleep(1200);const s=await send("Page.captureScreenshot",{format:"png"});fs.writeFileSync(process.argv[2],Buffer.from(s.data,"base64"));ws.close();edge.kill();process.exit(0);
