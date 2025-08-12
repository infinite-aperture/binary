import React, { useCallback, useEffect, useMemo, useState } from "react";
import confetti from "canvas-confetti";

/** ========== Tiny CSS (scoped) ========== */
const Styles = () => (
  <style>{`
  :root{
    --bg:#0b1020; --panel:#121a34; --panel-2:#0f1730;
    --text:#eaf2ff; --muted:#a9b4d6; --brand:#6ea8fe; --brand-2:#6ef3ff;
    --border:#243055; --ok:#58e383; --warn:#ffc86e; --err:#ff7b7b;
  }
  *{box-sizing:border-box}
  html,body,#root{height:100%}
  body{margin:0;background:radial-gradient(1200px 600px at 10% -20%, #1b2552 0, transparent 60%),
                radial-gradient(1000px 500px at 110% -40%, #0b8373 0, transparent 55%), var(--bg);
       color:var(--text); font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif;}
  .container{max-width:1100px;margin:0 auto;padding:24px}
  .header{position:relative;margin-bottom:18px}
  .glow{position:absolute;inset:auto -20% -40px -20%;height:160px;filter:blur(60px);
        background:linear-gradient(90deg, #6ea8fe33, #6ef3ff33, #58e38333);}
  h1{margin:0;font-weight:700;letter-spacing:.2px}
  .muted{color:var(--muted);font-size:14px}

  .row{display:flex;gap:12px;align-items:center;flex-wrap:wrap}
  .spacer{flex:1}

  .card{background:linear-gradient(180deg, var(--panel), var(--panel-2)); border:1px solid var(--border);
        border-radius:16px; padding:16px; box-shadow:0 10px 30px rgba(0,0,0,.25); margin-bottom:16px}
  .card h3{margin:0 0 8px 0;font-size:16px}
  .grid{display:grid;gap:14px}
  @media(min-width:880px){ .grid-2{grid-template-columns:1fr 1fr} }

  .btn{background:#22315c;border:1px solid var(--border);color:#dfe8ff;padding:8px 12px;border-radius:10px;
       cursor:pointer;transition:.15s; font-weight:600}
  .btn:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(0,0,0,.3)}
  .btn.secondary{background:#172349}
  .btn.ghost{background:transparent}
  .btn.ok{background:#1f3f2d;border-color:#2e6c4f}
  .btn.warn{background:#3f341f;border-color:#6c5a2e}
  .btn.err{background:#3f1f1f;border-color:#6c2e2e}

  .badge{display:inline-flex;align-items:center;gap:6px; padding:4px 8px;border-radius:999px;
         border:1px solid var(--border); background:#1a2448; font-size:12px; color:#dbe6ff}
  .mono{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace}

  .progress{height:10px;background:#162044;border:1px solid var(--border);border-radius:999px;overflow:hidden}
  .progress>div{height:100%;background:linear-gradient(90deg,var(--brand),var(--brand-2));}

  .tabs{background:#111a36; border:1px solid var(--border); padding:4px;border-radius:12px; display:flex; gap:6px; flex-wrap:wrap}
  .tab{padding:8px 12px;border-radius:8px; cursor:pointer; font-weight:600; color:#cfe0ff; border:1px solid transparent}
  .tab.active{background:#203061; border-color:var(--border)}
  .tab:hover{filter:brightness(1.1)}

  .stat{display:flex;flex-direction:column;gap:2px}
  .label{font-size:12px;color:var(--muted)}
  .value{font-size:14px}

  .input, .num, .range{background:#0f172e;color:#eaf2ff;border:1px solid var(--border);border-radius:10px;padding:8px 10px}
  .range{height:8px;width:240px}
  .table{width:100%;border-collapse:collapse}
  .table th,.table td{border-bottom:1px solid #243055;padding:8px 6px;text-align:left}
  .sep{width:1px;background:#243055; align-self:stretch}
  .hint{font-size:13px;color:#cfe0ff; background:#11204a;border:1px solid #2b3c73;padding:8px;border-radius:10px}
`}</style>
);

/** ========== Utilities ========== */
const clamp = (n:number, a:number, b:number)=> Math.min(b, Math.max(a, n));
const randInt = (a:number, b:number)=> Math.floor(Math.random()*(b-a+1))+a;
const toBinary = (n:number, bits=8)=> n.toString(2).padStart(bits,"0");
const fromBinary = (bin:string)=> parseInt(bin, 2);

function ipToOctets(ip:string): number[] | null {
  const parts = ip.trim().split(".").map(Number);
  if (parts.length!==4 || parts.some(p=>Number.isNaN(p)||p<0||p>255)) return null;
  return parts;
}
const octetsToIp = (o:number[]) => o.join(".");
function cidrToMask(cidr:number){
  const bits = Array(32).fill(0).map((_,i)=> i<cidr?1:0);
  return [0,1,2,3].map(o=> fromBinary(bits.slice(o*8,o*8+8).join("")));
}
const maskToWildcard = (m:number[]) => m.map(o=>255-o);
const networkAddress = (ip:number[], mask:number[]) => ip.map((o,i)=> o & mask[i]);
const broadcastAddress = (ip:number[], mask:number[]) => ip.map((o,i)=> (o & mask[i]) | (255 ^ mask[i]));
function usableHosts(cidr:number){
  const hostBits = 32 - cidr;
  if (cidr===31) return 2;
  if (cidr===32) return 1;
  return Math.max(0, 2**hostBits - 2);
}
function randomPrivateIPv4(){
  const r = randInt(1,3);
  if (r===1) return `10.${randInt(0,255)}.${randInt(0,255)}.${randInt(0,255)}`;
  if (r===2) return `172.${randInt(16,31)}.${randInt(0,255)}.${randInt(0,255)}`;
  return `192.168.${randInt(0,255)}.${randInt(1,254)}`;
}

/** ========== Micro‑audio (optional) ========== */
function useBeep(enabled:boolean){
  const beep = useCallback((freq=880, duration=0.06)=>{
    if(!enabled) return;
    try{
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      const ctx = new Ctx();
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = freq; g.gain.value = 0.02; o.start();
      setTimeout(()=>{ o.stop(); ctx.close(); }, duration*1000);
    }catch{}
  }, [enabled]);
  return beep;
}

/** ========== Components ========== */
const Stat = ({label, value}:{label:string; value:string|number}) => (
  <div className="stat">
    <div className="label">{label}</div>
    <div className="value mono">{value}</div>
  </div>
);

const Card: React.FC<{title?:string; right?:React.ReactNode; children:React.ReactNode}> = ({title, right, children}) => (
  <div className="card">
    {title && <div className="row" style={{marginBottom:8}}>
      <h3>{title}</h3>
      <div className="spacer"/>
      {right}
    </div>}
    {children}
  </div>
);

const Progress = ({value}:{value:number}) => (
  <div className="progress"><div style={{width:`${clamp(value,0,100)}%`}}/></div>
);

/** ========== Game 1: Bit‑Flipper ========== */
function BitFlipper({onSuccess}:{onSuccess:(xp:number)=>void}){
  const [target, setTarget] = useState(randInt(0,255));
  const [bits, setBits] = useState<number[]>(Array(8).fill(0));
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);

  const value = useMemo(()=> fromBinary(bits.join("")), [bits]);

  useEffect(()=>{
    const onKey=(e:KeyboardEvent)=>{
      const idx = parseInt(e.key,10);
      if(!Number.isNaN(idx) && idx>=1 && idx<=8){
        const i = 8-idx; // 1->LSB
        setBits(prev => prev.map((b,k)=> k===i ? (b?0:1) : b));
      }
      if (e.key==="Enter") submit();
    };
    window.addEventListener("keydown", onKey);
    return ()=> window.removeEventListener("keydown", onKey);
  }, []);

  function toggle(i:number){ setBits(prev=> prev.map((b,k)=> k===i ? (b?0:1) : b)); }
  function reset(){ setBits(Array(8).fill(0)); setTarget(randInt(0,255)); }
  function submit(){
    if (value===target){
      setScore(s=>s+10+streak);
      setStreak(s=>s+1);
      onSuccess(15+streak);
      confetti({ particleCount: 70, spread: 70, origin: { y: .4 } });
      reset();
    } else {
      setStreak(0);
    }
  }

  return (
    <Card title="Bit‑Flipper (Dezimal ↔ Bits)" right={<span className="badge">Ziel: <span className="mono">{target}</span></span>}>
      <div className="row" style={{alignItems:"flex-start"}}>
        <div style={{flex:1}}>
          <div className="grid" style={{gridTemplateColumns:"repeat(8, minmax(64px,1fr))"}}>
            {bits.map((b,i)=>(
              <button key={i} className={`btn ${b? "ok": "secondary"}`} title={`Bit ${i} – Wert ${2**(7-i)}`} onClick={()=>toggle(i)}>
                <span className="mono">{2**(7-i)}</span>
              </button>
            ))}
          </div>
          <div style={{marginTop:10}} className="mono">Aktuell: {value} (bin: {bits.join("")})</div>
          <div className="row" style={{marginTop:10}}>
            <button className="btn ok" onClick={submit}>Prüfen</button>
            <button className="btn ghost" onClick={reset}>Neu</button>
          </div>
        </div>
        <div className="sep" />
        <div style={{display:"grid", gap:8, minWidth:180}}>
          <div><span className="badge">Score</span> <span className="mono">{score}</span></div>
          <div><span className="badge">Streak</span> <span className="mono">{streak}</span></div>
          <div className="hint">Tipp: Tasten <span className="mono">1–8</span> toggeln Bits; <span className="mono">Enter</span> prüft.</div>
        </div>
      </div>
    </Card>
  );
}

/** ========== Game 2: Subnet‑Maske bauen ========== */
function SubnetMaskBuilder(){
  const [cidr, setCidr] = useState(24);
  const mask = useMemo(()=> cidrToMask(cidr), [cidr]);
  const maskBin = mask.map(o=>toBinary(o)).join(" ");
  const wildcard = maskToWildcard(mask);

  return (
    <Card title="Subnet‑Maske bauen (CIDR → Maske)">
      <div className="row">
        <span className="muted">/CIDR</span>
        <input className="range" type="range" min={0} max={32} step={1} value={cidr} onChange={e=>setCidr(e.target.valueAsNumber)} />
        <span className="badge mono">/{cidr}</span>
        <span className="muted" title="CIDR: Anzahl Netzbits. /24 = 255.255.255.0" style={{cursor:"help"}}>Was ist CIDR?</span>
      </div>
      <div className="grid grid-2" style={{marginTop:12}}>
        <Card><h3>Maske</h3><div className="mono" style={{fontSize:18}}>{mask.join(".")}</div><div className="mono muted" style={{fontSize:12}}>{maskBin}</div></Card>
        <Card><h3>Wildcard</h3><div className="mono" style={{fontSize:18}}>{wildcard.join(".")}</div><div className="muted" style={{fontSize:12}}>(255 - Maske)</div></Card>
      </div>
      <div className="muted" style={{marginTop:8}}>Host‑Adressen: <span className="mono">{usableHosts(cidr)}</span></div>
    </Card>
  );
}

/** ========== Game 3: IPv4 Challenge ========== */
function IPv4Challenge({onSuccess}:{onSuccess:(xp:number)=>void}){
  const [cidr, setCidr] = useState(24);
  const [ip, setIp] = useState(randomPrivateIPv4());
  const [answer, setAnswer] = useState({network:"", broadcast:"", first:"", last:""});
  const [feedback, setFeedback] = useState<string | null>(null);

  const mask = useMemo(()=> cidrToMask(cidr), [cidr]);
  const ipOct = useMemo(()=> ipToOctets(ip) ?? [0,0,0,0], [ip]);
  const net = useMemo(()=> networkAddress(ipOct, mask), [ipOct, mask]);
  const bc  = useMemo(()=> broadcastAddress(ipOct, mask), [ipOct, mask]);
  const usable = useMemo(()=> usableHosts(cidr), [cidr]);

  useEffect(()=> setFeedback(null), [ip, cidr]);

  function check(){
    const aNet = ipToOctets(answer.network);
    const aBc = ipToOctets(answer.broadcast);
    const aFirst = ipToOctets(answer.first);
    const aLast = ipToOctets(answer.last);
    const okNet = aNet && octetsToIp(aNet)===octetsToIp(net);
    const okBc  = aBc && octetsToIp(aBc)===octetsToIp(bc);

    const expFirst = (()=>{
      if (cidr>=31) return net;
      const n=[...net]; n[3] = n[3]+1; return n;
    })();
    const expLast = (()=>{
      if (cidr>=31) return bc;
      const b=[...bc]; b[3] = b[3]-1; return b;
    })();

    const okFirst = aFirst && octetsToIp(aFirst)===octetsToIp(expFirst);
    const okLast  = aLast  && octetsToIp(aLast)===octetsToIp(expLast);

    if (okNet && okBc && okFirst && okLast){
      setFeedback("✅ Korrekt! Nice.");
      onSuccess(25);
      confetti({ particleCount: 80, spread: 80, origin: { y: 0.35 } });
    } else {
      setFeedback("❌ Nicht ganz. Versuch's nochmal oder nutze die Lösung.");
    }
  }

  function reveal(){
    setAnswer({
      network: octetsToIp(net),
      broadcast: octetsToIp(bc),
      first: octetsToIp(cidr>=31? net : (()=>{const n=[...net]; n[3]++; return n;})()),
      last:  octetsToIp(cidr>=31? bc  : (()=>{const b=[...bc];  b[3]--; return b;})()),
    });
    setFeedback("ℹ️ Lösung eingeblendet.");
  }

  function newTask(){
    setIp(randomPrivateIPv4());
    setCidr(randInt(8,30));
    setAnswer({network:"", broadcast:"", first:"", last:""});
    setFeedback(null);
  }

  return (
    <Card title="IPv4 Challenge (Netz, Broadcast, Usable)"
          right={<button className="btn ghost" onClick={newTask}>Neu</button>}>
      <div className="row" style={{marginBottom:8}}>
        <span className="muted">IP</span>
        <input className="input" style={{width:170}} value={ip} onChange={e=>setIp(e.target.value)} />
        <span className="muted">/CIDR</span>
        <input className="num" style={{width:90}} type="number" min={0} max={32}
               value={cidr} onChange={e=>setCidr(clamp(Number(e.target.value),0,32))}/>
        <button className="btn" onClick={()=>setFeedback("Tipp: Netz = IP AND Maske; Broadcast = Netz OR (NOT Maske). Erste/Letzte = ±1 (außer /31,/32).")}>Tipp</button>
        <button className="btn ghost" onClick={reveal}>Lösung</button>
      </div>

      <div className="grid grid-2">
        <div className="grid">
          <label className="label">Netzwerkadresse</label>
          <input className="input" placeholder="z.B. 192.168.1.0"
                 value={answer.network} onChange={e=>setAnswer(a=>({...a, network:e.target.value}))}/>
          <label className="label">Broadcastadresse</label>
          <input className="input" placeholder="z.B. 192.168.1.255"
                 value={answer.broadcast} onChange={e=>setAnswer(a=>({...a, broadcast:e.target.value}))}/>
        </div>
        <div className="grid">
          <label className="label">Erste nutzbare</label>
          <input className="input" placeholder="z.B. 192.168.1.1"
                 value={answer.first} onChange={e=>setAnswer(a=>({...a, first:e.target.value}))}/>
          <label className="label">Letzte nutzbare</label>
          <input className="input" placeholder="z.B. 192.168.1.254"
                 value={answer.last} onChange={e=>setAnswer(a=>({...a, last:e.target.value}))}/>
        </div>
      </div>

      <div className="row" style={{marginTop:10}}>
        <Stat label="Maske" value={cidrToMask(cidr).join(".")} />
        <Stat label="Wildcard" value={maskToWildcard(mask).join(".")} />
        <Stat label="Hosts" value={usable} />
        <Stat label="Netz" value={octetsToIp(net)} />
        <Stat label="Broadcast" value={octetsToIp(bc)} />
      </div>

      <div className="row" style={{marginTop:10}}>
        <button className="btn ok" onClick={check}>Prüfen</button>
      </div>
      {feedback && <div className="hint" style={{marginTop:10}}>{feedback}</div>}
    </Card>
  );
}

/** ========== Game 4: CIDR‑Split ========== */
function CidrSplit(){
  const [baseCidr] = useState(24);
  const [baseNet] = useState("192.168.10.0");
  const [subnets, setSubnets] = useState(4);

  const neededBits = useMemo(()=> Math.ceil(Math.log2(subnets)), [subnets]);
  const newCidr = clamp(baseCidr + neededBits, 0, 32);
  const size = 2 ** (32 - newCidr);
  const baseOctets = ipToOctets(baseNet) ?? [0,0,0,0];

  function calcSubnet(i:number){
    const base = (baseOctets[0]<<24) | (baseOctets[1]<<16) | (baseOctets[2]<<8) | (baseOctets[3]);
    const start = (base + i * size) >>> 0;
    const end = (start + size - 1) >>> 0;
    const toIp = (n:number)=> [(n>>>24)&255, (n>>>16)&255, (n>>>8)&255, n&255].join('.');
    const net = toIp(start);
    const bc  = toIp(end);
    const first = newCidr>=31? net : toIp(start+1);
    const last  = newCidr>=31? bc  : toIp(end-1);
    return {net, bc, first, last};
  }
  const rows = Array.from({length: subnets}, (_,i)=> ({i, ...calcSubnet(i)}));

  return (
    <Card title="CIDR‑Split (gleich große Subnetze)">
      <div className="row" style={{marginBottom:8}}>
        <span className="muted">Ausgangsnetz</span>
        <span className="badge mono">{baseNet}/{baseCidr}</span>
        <span className="muted">Anzahl Subnetze</span>
        <input className="num" type="number" min={1} max={64} value={subnets}
               onChange={e=>setSubnets(clamp(e.target.valueAsNumber || 1, 1, 64))} style={{width:100}}/>
        <span className="muted">Benötigte Bits: <span className="mono">{neededBits}</span></span>
        <span className="muted">Neues CIDR: <span className="badge mono">/{newCidr}</span></span>
      </div>
      <div style={{overflow:"auto"}}>
        <table className="table mono">
          <thead><tr><th>#</th><th>Netz</th><th>Broadcast</th><th>Erste</th><th>Letzte</th></tr></thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r.i}>
                <td>{r.i}</td>
                <td>{r.net}/{newCidr}</td>
                <td>{r.bc}</td>
                <td>{r.first}</td>
                <td>{r.last}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/** ========== Main App ========== */
export default function App(){
  const [tab, setTab] = useState<"flip"|"mask"|"challenge"|"split">("flip");
  const [timer, setTimer] = useState(0);
  const [running, setRunning] = useState(false);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [sound, setSound] = useState(true);
  const beep = useBeep(sound);

  const levelCap = 100 + (level-1)*40;
  const progress = Math.min(100, Math.round((xp/levelCap)*100));

  useEffect(()=>{
    if (xp >= levelCap){
      setLevel(l=>l+1);
      setXp(xp - levelCap);
      confetti({ particleCount: 120, spread: 100, origin: { y: 0.3 } });
    }
  }, [xp]);

  useEffect(()=>{
    if (!running) return;
    const id = setInterval(()=> setTimer(t=>t+1), 1000);
    return ()=> clearInterval(id);
  }, [running]);

  function reward(points:number){ setXp(x=>x+points); beep(1100, 0.05); }
  function resetTimer(){ setTimer(0); }

  return (
    <div>
      <Styles/>
      <div className="glow"></div>
      <div className="container">
        <div className="header">
          <h1>Binary & Subnet Trainer</h1>
          <div className="muted">Spielerisch Bits, CIDR und Subnetting lernen – perfekt für IHK/AP1.</div>
        </div>

        <div className="row" style={{marginBottom:12}}>
          <span className="badge">Lvl <span className="mono">{level}</span></span>
          <div style={{width:260}}><Progress value={progress}/></div>
          <span className="muted mono">{xp}/{levelCap} XP</span>
          <div className="spacer"/>
          <button className={`btn ${running? 'err':'ok'}`} onClick={()=>setRunning(r=>!r)}>{running? 'Stopp':'Timer'}</button>
          <button className="btn ghost" onClick={resetTimer}>Reset</button>
          <span className="badge mono">{Math.floor(timer/60)}:{String(timer%60).padStart(2,'0')}</span>
          <button className="btn ghost" title="Sound an/aus" onClick={()=>setSound(s=>!s)}>{sound? '🔊':'🔈'}</button>
        </div>

        <div className="tabs" role="tablist" aria-label="Trainer Tabs">
          <button className={`tab ${tab==='flip'?'active':''}`} onClick={()=>setTab('flip')}>Bit‑Flipper</button>
          <button className={`tab ${tab==='mask'?'active':''}`} onClick={()=>setTab('mask')}>Maske</button>
          <button className={`tab ${tab==='challenge'?'active':''}`} onClick={()=>setTab('challenge')}>IPv4 Challenge</button>
          <button className={`tab ${tab==='split'?'active':''}`} onClick={()=>setTab('split')}>CIDR‑Split</button>
        </div>

        {tab==='flip' && <div style={{marginTop:14}}><BitFlipper onSuccess={reward}/></div>}
        {tab==='mask' && <div style={{marginTop:14}}><SubnetMaskBuilder/></div>}
        {tab==='challenge' && <div style={{marginTop:14}}><IPv4Challenge onSuccess={reward}/></div>}
        {tab==='split' && <div style={{marginTop:14}}><CidrSplit/></div>}

        <div className="muted" style={{marginTop:16}}>
          Nächste Schritte: IPv6‑Quests (Präfixe, Hextets, SLAAC), Prüfungsmodus mit 10‑Min.-Timer & Export.
        </div>
      </div>
    </div>
  );
}