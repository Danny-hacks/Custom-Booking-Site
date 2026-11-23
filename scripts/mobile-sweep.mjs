import { spawn } from "node:child_process";
const port=9352;const edge=spawn("C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",["--headless=new","--disable-gpu",`--remote-debugging-port=${port}`,"--user-data-dir="+process.env.TEMP+"/lb-sw","about:blank"],{stdio:"ignore"});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let t;for(let i=0;i<40&&!t;i++){try{t=await(await fetch(`http://127.0.0.1:${port}/json/new?about:blank`,{method:"PUT"})).json()}catch{await sleep(300)}}
const ws=new WebSocket(t.webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);let id=0;const p=new Map();ws.onmessage=m=>{const d=JSON.parse(m.data);if(d.id&&p.has(d.id)){p.get(d.id)(d.result);p.delete(d.id)}};
const send=(method,params={})=>new Promise(r=>{const i=++id;p.set(i,r);ws.send(JSON.stringify({id:i,method,params}))});
await send("Emulation.setDeviceMetricsOverride",{width:360,height:800,deviceScaleFactor:1,mobile:true});
const paths=["/area"];
for(const l of ["en","fr"])for(const x of paths){
 await send("Page.navigate",{url:`http://localhost:3000/${l}${x}`});await sleep(3500);
 const v=(await send("Runtime.evaluate",{expression:`(()=>{const w=innerWidth;const bad=[].map(e=>e.tagName+'.'+String(e.className).slice(0,70)+" r="+Math.round(e.getBoundingClientRect().right));scrollTo(100,0);return "scrollX="+scrollX+" "+' | sw='+document.documentElement.scrollWidth+' | '+JSON.stringify(bad)})()`,returnByValue:true})).result.value;
 console.log(`/${l}${x}`.padEnd(22),v);}
ws.close();edge.kill();process.exit(0);
