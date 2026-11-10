// @ts-nocheck
// Verticals stack: themed 3D rings (B/Algo sorter, B/Uild gears, B/Hack sprint bezel, B/Dev git graph).
// Ported from the standalone "Verticals stack - 3D" design. Same props as before.
import { useEffect, useRef, useState } from 'react';
import * as T from 'three';
import './VerticalStack3D.css';
import { Vertical } from '../data/club';

interface VerticalStackProps {
  onSelectVertical?: (vertId: Vertical['id']) => void;
  activeVerticalId?: Vertical['id'] | null;
  onJoin?: (vertId: Vertical['id']) => void;
  onFocusChange?: (focused: boolean) => void;
  controlRef?: { current: { select: (id: string) => void } | null };
}

const V: any[]=[
 {id:'B/Algo',tag:'computer programming and problem solving',c:'#7F77DD',y:4.3,desc:'Master advanced algorithms, competitive sprints, computational geometry, and algorithmic art.',does:['Solve graph theory, DP, and dynamic tree puzzles under clock pressure','Compete in collegiate algorithmic battles, ICPC qualifiers & weekly heats','Optimize hot code paths to sub-millisecond execution times']},
 {id:'B/Uild',tag:'robotics and hardware',c:'#1D9E75',y:2.15,desc:'Bridge firmware with the physical realm: soldering circuits, CAD mechanics, sensor telemetry, and rovers.',does:['Design modular PCBs, motor controllers & telemetry transceivers','Assemble autonomous rovers with computer vision and LiDAR navigation','Compete in university hardware hackathons and combat robotics arenas']},
 {id:'B/Hack',tag:'hackathons and team challenges',c:'#D85A30',y:0,desc:'Assemble lightning-fast cross-discipline squads to turn wild ideas into functional moonshots in 36 hours.',does:['Master rapid ideation, wireframing, pitch rehearsal & sleepless sprint stamina','Participate in national and international hackathon road trips','Ship polished MVPs with real users before Sunday demo judging']},
 {id:'B/Dev',tag:'open source and web development',c:'#378ADD',y:-2.15,desc:'Craft high-performance distributed systems, modern web platforms, and contribute to world-class OSS repos.',does:['Build scalable web stacks with TypeScript, React, Rust, and Go','Contribute upstream PRs to major open-source ecosystems','Deploy and maintain developer tooling for the college student body']}
];
// micro-animated icons + one-line "what you're looking at" for each ring
const ICON: Record<string,string>={
 'B/Algo':'<svg viewBox="0 0 40 28" fill="currentColor"><rect class="bar" x="3" y="4" width="6" height="22"/><rect class="bar" style="animation-delay:.3s" x="12" y="4" width="6" height="22"/><rect class="bar" style="animation-delay:.6s" x="21" y="4" width="6" height="22"/><rect class="bar" style="animation-delay:.9s" x="30" y="4" width="6" height="22"/></svg>',
 'B/Uild':'<svg viewBox="0 0 40 28" fill="none" stroke="currentColor" stroke-width="4"><circle class="spin" cx="13" cy="14" r="8" stroke-dasharray="3.4 2.5"/><circle class="spin r" cx="28" cy="14" r="6" stroke-dasharray="2.6 2.2"/></svg>',
 'B/Hack':'<svg viewBox="0 0 40 28" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="20" cy="14" r="11" stroke-dasharray="2.6 1.9"/><line class="hand" x1="20" y1="14" x2="20" y2="6" stroke-linecap="round"/></svg>',
 'B/Dev':'<svg viewBox="0 0 40 28" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 22H36M12 22C16 22 14 6 20 6S24 22 28 22"/><g fill="currentColor" stroke="none"><circle class="dot" cx="4" cy="22" r="3"/><circle class="dot" style="animation-delay:.3s" cx="20" cy="6" r="3"/><circle class="dot" style="animation-delay:.6s" cx="36" cy="22" r="3"/></g></svg>'};
const HOW: Record<string,string>={'B/Algo':'Live bubble sort: problem solving, one swap at a time','B/Uild':'Counter-turning gears and status LEDs: hardware that moves','B/Hack':'36 blocks, one per sprint hour, with a timer sweeping round','B/Dev':'A git graph: branches fork, commits pulse, branches merge'};

export default function VerticalStack3D({ onJoin, onFocusChange, controlRef }: VerticalStackProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selId, setSelId] = useState<string | null>(null);
  const lastSel = useRef<string>(V[0].id);
  if (selId) lastSel.current = selId;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;
    let cancelled = false;
    let teardown: (() => void) | undefined;

    const api: any = {
      onHover: (id: string | null) => setHoveredId(id),
      onSelect: (id: string | null) => setSelId(id),
      ctrl: null,
    };
    apiRef.current = api;
    if (controlRef) controlRef.current = { select: (id: string) => api.ctrl && api.ctrl.select(id) };

    (async () => {
      // canvas textures use these fonts, so wait for them before drawing
      try {
        await Promise.all([
          document.fonts.load('800 100px "Bricolage Grotesque"'),
          document.fonts.load('500 14px "Fira Code"'),
          document.fonts.load('700 100px "Fira Code"'),
          document.fonts.load('100px "Permanent Marker"'),
          document.fonts.load('100px "Saira Stencil One"'),
          document.fonts.load('700 100px "Space Grotesk"'),
        ]);
      } catch (e) {}
      if (cancelled) return;
      try {
        teardown = init(container, api, onFocusChange);
      } catch (err) {
        console.error('VerticalStack3D failed to initialise:', err);
      }
    })();

    return () => {
      cancelled = true;
      if (controlRef) controlRef.current = null;
      teardown && teardown();
    };
  }, []);

  const ctl = () => apiRef.current && apiRef.current.ctrl;
  const v = V.find((x) => x.id === hoveredId);
  const sv = V.find((x) => x.id === lastSel.current);

  return (
    <div className={`vstack relative w-full h-[560px] min-[400px]:h-[620px] sm:h-[700px] rounded-2xl${selId ? ' focus-mode' : ''}`}>
      {selId && <nav className="focus-pills" aria-label="Switch vertical">{V.map((item) => <button key={item.id} className={item.id === selId ? 'active' : ''} style={{ ['--c' as any]: item.c }} onClick={() => ctl() && ctl().select(item.id)}>{item.id}</button>)}</nav>}
      <div
        ref={mountRef}
        tabIndex={0}
        aria-label="Verticals stack. Arrow keys to browse, Enter to open, Escape to close."
        className="vstack-stage w-full h-full cursor-grab active:cursor-grabbing outline-none"
        data-testid="vertical-stack-canvas"
      />

      <div
        className="pointer-events-none absolute left-1/2 bottom-3 -translate-x-1/2 w-[min(92%,460px)] text-center min-h-[48px] px-4 py-3 rounded-2xl bg-[#06050E]/85 border border-white/15 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.55)] transition-opacity duration-200"
        style={{ opacity: selId ? 0 : 1 }}
      >
        {v ? (
          <>
            <div className="flex items-center justify-center gap-2.5">
              <span className="ic" style={{ color: v.c }} dangerouslySetInnerHTML={{ __html: ICON[v.id] }} />
              <b className="font-display font-extrabold text-xl" style={{ color: v.c, textShadow: '0 0 12px rgba(0,0,0,0.6)' }}>{v.id}</b>
            </div>
            <span className="block mt-1 text-[13px] font-medium text-[#E6EDF7]">{v.tag}</span>
            <span className="block mt-1 font-mono text-xs text-[#67E8F9]">{HOW[v.id]}</span>
            <span className="block mt-1 text-[13px] text-[#CFCBE8]">Click or tap to open its dossier.</span>
          </>
        ) : (
          <span className="block text-[13px] text-[#CFCBE8]">Hover a band to open the stack. Click one to open its dossier.</span>
        )}
      </div>

      <div className="pointer-events-none absolute top-2 left-3 max-w-[calc(100%-1.5rem)] font-mono text-[9px] sm:text-[10px] text-[#A7A3C7]/70 bg-black/30 px-2 py-1 rounded">
        DRAG TO ROTATE ↻ · ARROW KEYS WORK TOO
      </div>

      <aside className={`dos${selId ? ' open' : ''}`} style={{ ['--c' as any]: sv.c }} aria-live="polite">
        <button className="x" aria-label="Close" onClick={() => ctl() && ctl().close()}>×</button>
        <span className="chip">VERTICAL DOSSIER</span>
        <span className="ic" dangerouslySetInnerHTML={{ __html: ICON[sv.id] }} />
        <h2>{sv.id}</h2>
        <p className="tag">{sv.tag}</p>
        <p className="how">{HOW[sv.id]}</p>
        <p className="desc">{sv.desc}</p>
        <ul>{sv.does.map((d: string) => <li key={d}>{d}</li>)}</ul>
        <div className="act">
          <button className="join" onClick={() => onJoin && onJoin(sv.id)}>Join {sv.id}</button>
          <button aria-label="Previous vertical" onClick={() => ctl() && ctl().step(-1)}>‹</button>
          <button aria-label="Next vertical" onClick={() => ctl() && ctl().step(1)}>›</button>
        </div>
      </aside>
    </div>
  );
}

function init(container: HTMLElement, api: any, onFocusChange?: (focused: boolean) => void) {
    const PI=Math.PI,reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,coarse=matchMedia('(pointer: coarse)').matches;
    const mulberry=(a)=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
    const rnd=mulberry(7);
    const ct=(c)=>{const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t};
    const stage=container;
    const scene=new T.Scene();
    const cam=new T.PerspectiveCamera(38,1,.1,150);
    const ren=new T.WebGLRenderer({antialias:!coarse,alpha:true});ren.setClearColor(0x000000,0);
    ren.setPixelRatio(Math.min(devicePixelRatio,coarse?1.5:2));
    ren.toneMapping=T.ACESFilmicToneMapping;ren.toneMappingExposure=1;
    ren.shadowMap.enabled=true;ren.shadowMap.type=T.PCFShadowMap;
    stage.appendChild(ren.domElement);

    const cv=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
    const warp=(g,amp,ph)=>{const p=g.attributes.position;for(let i=0;i<p.count;i++){const a=Math.atan2(p.getX(i),p.getZ(i));p.setY(i,p.getY(i)+amp*Math.sin(2*a+ph))}g.computeVertexNormals();return g};
    const hash=(x,y,z)=>{const s=Math.sin(x*12.9898+y*78.233+z*37.719)*43758.5453;return s-Math.floor(s)};
    const phys=o=>{const m=new T.MeshPhysicalMaterial(Object.assign({envMapIntensity:.9},o));m.shadowSide=T.DoubleSide;return m};

    // neutral studio environment: soft boxes for reflections
    {const envS=new T.Scene(),c=cv(512,256),x=c.getContext('2d'),g=x.createLinearGradient(0,0,0,256);
     [[0,'#9aa3bd'],[.45,'#6b7490'],[.55,'#2a2d3a'],[1,'#101118']].forEach(a=>g.addColorStop(a[0],a[1]));x.fillStyle=g;x.fillRect(0,0,512,256);
     [['#ffffff',60,50,150,90],['#ffffff',300,40,120,100],['#9fc0ff',440,70,40,110],['#ffd9b0',200,110,50,60]].forEach(b=>{x.fillStyle=b[0];x.fillRect(b[1],b[2],b[3],b[4])});
     envS.add(new T.Mesh(new T.SphereGeometry(10,32,16),new T.MeshBasicMaterial({map:ct(c),side:T.BackSide})));
     const pm=new T.PMREMGenerator(ren);scene.environment=pm.fromScene(envS,.02).texture;pm.dispose()}

    scene.add(new T.HemisphereLight(0xcfd8ff,0x2a2236,.35*PI));
    const key=new T.DirectionalLight(0xfff3e4,1.1*PI);key.position.set(6,12,8);key.castShadow=true;
    Object.assign(key.shadow.camera,{left:-8,right:8,top:10,bottom:-8,near:1,far:40});key.shadow.mapSize.set(coarse?1024:2048,coarse?1024:2048);key.shadow.bias=-.0004;key.shadow.normalBias=.03;scene.add(key);
    const rim=new T.DirectionalLight(0x9db4ff,.5*PI);rim.position.set(-8,5,-8);scene.add(rim);

    // name plates: dark plate, border in the vertical's colour, white lettering
    // name plates: each vertical gets its own lettering, built to match its ring
    const rr=(x,a,b,w,h,r)=>{x.beginPath();x.moveTo(a+r,b);x.arcTo(a+w,b,a+w,b+h,r);x.arcTo(a+w,b+h,a,b+h,r);x.arcTo(a,b+h,a,b,r);x.arcTo(a,b,a+w,b,r);x.closePath()};
    const PLATE={
     // code editor: syntax-coloured mono, line numbers, comment, blinking-style caret
     'B/Algo':(x,col)=>{
      rr(x,6,6,1012,244,26);x.fillStyle='#0f0d24';x.fill();x.lineWidth=6;x.strokeStyle=col;x.stroke();
      x.textBaseline='alphabetic';x.textAlign='left';x.font='500 26px "Fira Code", monospace';x.fillStyle='#5b5694';x.fillText('1',34,70);x.fillText('2',34,196);
      x.fillStyle='#7d79b8';x.fillText('// sort it out',96,70);
      x.font='700 118px "Fira Code", monospace';const parts=[['B',col],['/','#67E8F9'],['Algo','#ffffff']],w=x.measureText('B/Algo').width;let p=(1024-w)/2+20;
      parts.forEach(([s,c])=>{x.fillStyle=c;x.fillText(s,p,200);p+=x.measureText(s).width});
      x.globalAlpha=.9;x.fillStyle=col;x.fillRect(p+8,112,34,92);x.globalAlpha=1;
      x.font='500 26px "Fira Code", monospace';x.fillStyle='#5b5694';x.textAlign='right';x.fillText('O(n²)',990,70)},
     // stamped steel plate: hazard stripes, rivets, stencil letters
     'B/Uild':(x,col)=>{
      const g=x.createLinearGradient(0,0,0,256);[[0,'#7a7f98'],[.5,'#454960'],[1,'#5a5f78']].forEach(a=>g.addColorStop(a[0],a[1]));
      rr(x,6,6,1012,244,30);x.fillStyle=g;x.fill();x.lineWidth=6;x.strokeStyle='#23253a';x.stroke();
      x.save();rr(x,6,6,1012,244,30);x.clip();
      [0,230].forEach(y0=>{x.fillStyle='#14161f';x.fillRect(0,y0,1024,26);x.fillStyle=col;for(let i=0;i<28;i++){const X=i*40+10;x.beginPath();x.moveTo(X,y0);x.lineTo(X+20,y0);x.lineTo(X-6,y0+26);x.lineTo(X-26,y0+26);x.fill()}});
      x.restore();
      [[44,128],[980,128]].forEach(([a,b])=>{const r=x.createRadialGradient(a-3,b-3,1,a,b,12);r.addColorStop(0,'#ffffff');r.addColorStop(1,'#2a2c3c');x.fillStyle=r;x.beginPath();x.arc(a,b,12,0,7);x.fill()});
      x.textBaseline='middle';x.textAlign='center';x.font='400 128px "Saira Stencil One", sans-serif';x.fillStyle='#161826';x.fillText('B/UILD',515,133);x.fillStyle='#f1f4fb';x.fillText('B/UILD',512,130);
      x.font='500 20px "Fira Code", monospace';x.fillStyle='#161826';x.fillText('UILD-04  //  ROBOTICS & HARDWARE',512,212)},
     // hacker sticker: marker lettering with every letter a little different, bolt and sprint tag
     'B/Hack':(x,col)=>{
      x.save();x.translate(512,128);x.rotate(-.03);x.translate(-512,-128);
      rr(x,14,18,996,220,44);const g=x.createLinearGradient(0,0,1024,256);g.addColorStop(0,'#ff8a4a');g.addColorStop(1,col);x.fillStyle=g;x.fill();x.lineWidth=12;x.strokeStyle='#fff3e6';x.stroke();
      x.textBaseline='alphabetic';x.font='150px "Permanent Marker", cursive';const s=[...'B/Hack'];let tw=0;const ws=s.map(ch=>{const w=x.measureText(ch).width;tw+=w;return w});let p=(1024-tw)/2-30;
      s.forEach((ch,i)=>{x.save();x.translate(p+ws[i]/2,182+(rnd()-.5)*22);x.rotate((rnd()-.5)*.28);const k=.9+rnd()*.3;x.scale(k,k);x.textAlign='center';x.lineWidth=9;x.lineJoin='round';x.strokeStyle='#fff3e6';x.strokeText(ch,0,0);x.fillStyle='#1a0c08';x.fillText(ch,0,0);x.restore();p+=ws[i]});
      x.fillStyle='#ffe14d';x.strokeStyle='#1a0c08';x.lineWidth=6;x.beginPath();[[905,40],[850,135],[890,135],[865,220],[945,110],[902,110],[935,40]].forEach(([a,b],i)=>i?x.lineTo(a,b):x.moveTo(a,b));x.closePath();x.fill();x.stroke();
      x.textAlign='left';x.font='22px "Permanent Marker", cursive';x.fillStyle='#1a0c08';x.fillText('36H SPRINT',52,62);x.restore()},
     // browser window: traffic lights, address bar, gradient lettering between angle brackets
     'B/Dev':(x,col)=>{
      rr(x,6,6,1012,244,26);x.fillStyle='#0d1829';x.fill();x.lineWidth=6;x.strokeStyle=col;x.stroke();
      x.save();rr(x,6,6,1012,244,26);x.clip();x.fillStyle='#17304f';x.fillRect(0,0,1024,66);x.restore();
      [['#ff5f57',44],['#febc2e',78],['#28c840',112]].forEach(([c,a])=>{x.fillStyle=c;x.beginPath();x.arc(a,36,10,0,7);x.fill()});
      rr(x,160,16,560,40,20);x.fillStyle='#0a1222';x.fill();x.textBaseline='middle';x.font='500 22px "Fira Code", monospace';x.fillStyle='#7aa6d6';x.textAlign='left';x.fillText('https://b.stack/dev',182,37);
      x.font='700 100px "Fira Code", monospace';x.fillStyle='#2b4f80';x.fillText('<',50,170);x.textAlign='right';x.fillText('/>',974,170);
      x.font='700 126px "Space Grotesk", sans-serif';x.textAlign='center';const g=x.createLinearGradient(300,0,724,0);g.addColorStop(0,col);g.addColorStop(1,'#67E8F9');x.fillStyle=g;x.fillText('B/Dev',512,172)}
    };
    function plateTex(text,col){const c=cv(1024,256),x=c.getContext('2d');PLATE[text](x,col);const t=ct(c);t.anisotropy=4;return t}
    function arcs(R,hh,amp,ph,text,off,col){const out=[],len=hh*4/(R+off),tex=plateTex(text,col);
     [0,Math.PI].forEach(c=>{const g=warp(new T.CylinderGeometry(R+off,R+off,hh,32,1,true,c-len/2,len),amp,ph);
      out.push(new T.Mesh(g,new T.MeshStandardMaterial({map:tex,alphaTest:.4,roughness:.45,metalness:.3,emissive:0xffffff,emissiveMap:tex,emissiveIntensity:.12})))});out.forEach(m=>m.userData.lbl=1);return out}
    const plateGlow=(l,k)=>l.forEach(m=>m.material.emissiveIntensity=.12*Math.min(k,1)+Math.max(0,k-1)*.3);

    function codeTex(css){const c=cv(1024,128),x=c.getContext('2d');x.fillStyle=css;x.fillRect(0,0,1024,128);x.font='15px "Fira Code", monospace';
     const TOK=['const','=>','for(','i++','{ }','O(n log n)','dp[i]','return','git push','npm run','</div>','async','import','fn main','0x1F','while(1)','merge()','$ ls'];
     for(let r=0;r<8;r++){let s='';while(s.length<110)s+=TOK[(rnd()*TOK.length)|0]+'   ';x.fillStyle=`rgba(255,255,255,${.1+rnd()*.18})`;x.fillText(s,-rnd()*200,16+r*15)}
     const t=ct(c);t.wrapS=T.RepeatWrapping;t.repeat.set(3,1);return t}

    const stack=new T.Group();scene.add(stack);
    const bands=[],pick=[];
    const rimMat=phys({color:0xb5bccc,metalness:1,roughness:.25});

    // ---------- four themed bands: each ring is built from what its vertical is about ----------
    const rimTorus=(g,R,s,H)=>{const t=new T.Mesh(new T.TorusGeometry(R,.06,8,80),rimMat);t.rotation.x=Math.PI/2;t.position.y=s*H/2;g.add(t)};

    // real code on the B/Algo wall: four 90-degree panels, one language each
    const KW=new Set('public static void int for if else return def const new while in range class import let var from'.split(' ')),TY=new Set('String List Map Math System vector sort len print console log'.split(' '));
    const SNIPPETS=[
     {lang:'Java',pad:480,lines:['static void bubble(int[] a) {','  for (int j = 0; j < a.length - 1; j++)','    if (a[j] > a[j + 1]) swap(a, j);']},
     {lang:'Python',pad:44,lines:['def fib(n):','    a, b = 0, 1','    for _ in range(n): a, b = b, a + b']},
     {lang:'C++',pad:480,lines:['int lo = 0, hi = n - 1;','while (lo <= hi) { int mid = (lo + hi) / 2;','  a[mid] < x ? lo = mid + 1 : hi = mid - 1; }']},
     {lang:'JavaScript',pad:44,lines:['const memo = new Map();','const solve = (n) => n < 2 ? n :','  memo.get(n) ?? solve(n - 1) + solve(n - 2);']}];
    function snippetTex({lang,lines,pad}){const c=cv(1680,256),x=c.getContext('2d');
     const g=x.createLinearGradient(0,0,0,256);g.addColorStop(0,'#2d2878');g.addColorStop(1,'#241f66');x.fillStyle=g;x.fillRect(0,0,1680,256);
     x.font='500 40px "Fira Code", monospace';x.textBaseline='alphabetic';x.textAlign='left';
     lines.forEach((ln,r)=>{let px=pad;const y=96+r*62;
      (ln.match(/\/\/.*|#.*|"[^"]*"|'[^']*'|\d+|[A-Za-z_]\w*|\s+|./g)||[]).forEach(tk=>{x.fillStyle=/^(\/\/|#)/.test(tk)?'#7d79b8':/^["']/.test(tk)?'#8be9a8':/^\d/.test(tk)?'#ffb26b':KW.has(tk)?'#c9b8ff':TY.has(tk)?'#67E8F9':/^[A-Za-z_]/.test(tk)?'#e6e6ff':'#9aa0d0';x.fillText(tk,px,y);px+=x.measureText(tk).width})});
     x.font='500 22px "Fira Code", monospace';x.fillStyle='#8f8bd6';x.fillText(lang.toUpperCase(),pad,38);
     const t=ct(c);t.anisotropy=4;return t}

    // shared code-colouring + text panels for the other three rings
    'await async export default function void'.split(' ').forEach(w=>KW.add(w));
    const TOKRE=/\/\/.*|#.*|"[^"]*"|'[^']*'|\d+|[A-Za-z_]\w*|\s+|./g;
    function tokDraw(x,ln,px,y,P){(ln.match(TOKRE)||[]).forEach(tk=>{x.fillStyle=/^(\/\/|#)/.test(tk)?P.cm:/^["']/.test(tk)?P.st:/^\d/.test(tk)?P.nu:KW.has(tk)?P.kw:TY.has(tk)?P.ty:/^[A-Za-z_]/.test(tk)?P.df:P.pn;x.fillText(tk,px,y);px+=x.measureText(tk).width})}
    const PAL_UNIT={kw:'#8be9c0',ty:'#bff3e0',nu:'#ffd27a',st:'#a6f0c8',cm:'#9aa3b8',df:'#e6ecf8',pn:'#aab3c8'},PAL_DEV={kw:'#7fb2ff',ty:'#6fe3ff',nu:'#ffb26b',st:'#9be7c4',cm:'#6a86ab',df:'#a9c0e0',pn:'#7f95b8'};
    // B/Uild: engraved firmware + pin labels for the steel groove
    function engrTex(lines){const c=cv(1430,300),x=c.getContext('2d');x.font='500 44px "Fira Code", monospace';x.textBaseline='alphabetic';x.shadowColor='#0b0c14';x.shadowOffsetX=2;x.shadowOffsetY=2;
     lines.forEach((ln,r)=>tokDraw(x,ln,40,92+r*78,PAL_UNIT));const t=ct(c);t.anisotropy=4;return t}
    const UNIT_TXT=[['void setup() {','  pinMode(MOTOR, OUTPUT);','  Serial.begin(9600); }'],['VCC 5V    GND    TX    RX','PWM 490Hz    I2C 0x3C','MOTOR 12V    2.5A    CAN']];
    // B/Dev: dim web code behind the git graph, two lines above and two below the main line
    const DEV_TXT=[
     {pad:800,lines:['<nav class="bar">','  <a href="/join">Join us</a>','</nav>','<script src="app.js" defer><\/script>']},
     {pad:44,lines:['.card { display: grid; gap: 1rem; }','.card:hover { transform: scale(1.04); }','@media (max-width: 720px) {','  .card { grid-template-columns: 1fr; }']},
     {pad:800,lines:['const res = await fetch("/api/members");','const data: Member[] = await res.json();','export default function App() {','  return <Stack members={data} />; }']},
     {pad:44,lines:['$ git checkout -b feat/dark-mode','$ git commit -m "add dark mode"','$ git push origin feat/dark-mode','$ gh pr create --fill']}];
    function devTex({pad,lines}){const c=cv(1680,487),x=c.getContext('2d');x.font='500 32px "Fira Code", monospace';x.textBaseline='alphabetic';x.globalAlpha=.85;
     lines.forEach((ln,r)=>tokDraw(x,ln,pad,[70,128,380,438][r],PAL_DEV));const t=ct(c);t.anisotropy=4;return t}
    // B/Hack: hour numbers on the blocks
    const digTex=n=>{const c=cv(64,64),x=c.getContext('2d');x.font='700 44px "Fira Code", monospace';x.textAlign='center';x.textBaseline='middle';x.fillStyle='#ffe9d6';x.fillText(String(n).padStart(2,'0'),32,34);return ct(c)};

    // B/Algo: sorting-algorithm visualiser. A ring of bars runs a live bubble sort around a code-ribbon wall
    function mkAlgo(v,R){
     const g=new T.Group(),o=new T.Group(),H=.55;o.position.y=-.25;g.add(o);
     const walls=SNIPPETS.map((sn,q)=>{const tex=snippetTex(sn),m=phys({map:tex,bumpMap:tex,bumpScale:.6,metalness:.5,roughness:.35,clearcoat:.6,clearcoatRoughness:.3,emissive:new T.Color(v.c),emissiveIntensity:0,side:T.DoubleSide});
      o.add(new T.Mesh(new T.CylinderGeometry(R,R,H,40,1,true,q*Math.PI/2,Math.PI/2),m));return m});
     [1,-1].forEach(s=>rimTorus(o,R,s,H));
     const N=40,arr=Array.from({length:N},(_,i)=>i/(N-1)),shuffle=()=>{for(let i=N-1;i>0;i--){const j=(rnd()*(i+1))|0;const x=arr[i];arr[i]=arr[j];arr[j]=x}};shuffle();
     const bm=new T.MeshStandardMaterial({color:0xffffff,metalness:.4,roughness:.35,emissive:new T.Color(v.c),emissiveIntensity:.35});
     const bars=new T.InstancedMesh(new T.BoxGeometry(.22,1,.16),bm,N),d=new T.Object3D(),c1=new T.Color(v.c),c2=new T.Color('#67E8F9'),col=new T.Color();bars.frustumCulled=false;o.add(bars);
     let i=0,j=0,wait=0,tm=0,cmp=[-1,-1],kk=1;
     const paint=()=>{for(let k=0;k<N;k++){const a=k/N*Math.PI*2,h=.12+arr[k]*.5;d.position.set(R*Math.sin(a),H/2+h/2,R*Math.cos(a));d.rotation.set(0,a,0);d.scale.set(1,h,1);d.updateMatrix();bars.setMatrixAt(k,d.matrix);
      if(k===cmp[0]||k===cmp[1])col.set(0xffffff);else col.copy(c1).lerp(c2,arr[k]);bars.setColorAt(k,col)}bars.instanceMatrix.needsUpdate=true;bars.instanceColor.needsUpdate=true};
     const step=()=>{if(arr[j]>arr[j+1]){const x=arr[j];arr[j]=arr[j+1];arr[j+1]=x}cmp=[j,j+1];j++;if(j>=N-1-i){i++;j=0;if(i>=N-1){i=0;wait=1.5;cmp=[-1,-1]}}};
     paint();
     const lbl=arcs(R,.52,0,0,v.id,.04,v.c);lbl.forEach(l=>o.add(l));
     return{g,upd:(t,dt)=>{if(wait>0){wait-=dt;tm=0;if(wait<=0)shuffle()}else{tm+=dt*(kk>1.3?2.5:1);while(tm>.05){tm-=.05;step()}}paint()},
      apply:k=>{kk=k;walls.forEach(w=>w.emissiveIntensity=Math.max(0,k-1)*.15);bm.emissiveIntensity=.35+Math.max(0,k-1)*.5;plateGlow(lbl,k)}};
    }

    // B/Uild: robotics and hardware. Two counter-rotating toothed gears sandwich a steel groove with the name plate and status LEDs
    function gearGeo(Ro,Rr,Rh,n,d){const s=new T.Shape(),st=Math.PI*2/n;
     for(let i=0;i<n;i++){const a=i*st;[[Rr,-.36],[Ro,-.2],[Ro,.2],[Rr,.36]].forEach(([r,f],k)=>{const x=r*Math.cos(a+f*st),y=r*Math.sin(a+f*st);if(i+k)s.lineTo(x,y);else s.moveTo(x,y)})}
     const h=new T.Path();h.absarc(0,0,Rh,0,Math.PI*2,true);s.holes.push(h);
     const g=new T.ExtrudeGeometry(s,{depth:d,bevelEnabled:true,bevelSize:.025,bevelThickness:.025,bevelSegments:1,curveSegments:24});g.rotateX(-Math.PI/2);g.translate(0,-d/2,0);return g}
    function mkUnit(v,R){
     const g=new T.Group(),Rg=R-.1,steel=phys({color:0x3a3d52,metalness:.9,roughness:.32,side:T.DoubleSide}),gm=phys({color:0x4b5070,metalness:.9,roughness:.3});
     const gears=[1,-1].map(s=>{const m=new T.Mesh(gearGeo(R+.2,R,Rg-.05,30,.22),gm);m.position.y=s*.44;g.add(m);return m});
     g.add(new T.Mesh(new T.CylinderGeometry(Rg,Rg,.7,64,1,true),steel));
     const leds=[0,1,2].map(k=>new T.MeshStandardMaterial({color:0x063d2a,emissive:0x1d9e75,emissiveIntensity:.5,roughness:.1}));
     [.74,-.74,Math.PI+.74,Math.PI-.74].forEach((a,k)=>{const e=new T.Mesh(new T.SphereGeometry(.075,12,8),leds[k%3]);e.position.set((Rg+.04)*Math.sin(a),0,(Rg+.04)*Math.cos(a));g.add(e)});
     UNIT_TXT.forEach((ln,q)=>{const tex=engrTex(ln),m=new T.Mesh(new T.CylinderGeometry(Rg+.012,Rg+.012,.62,32,1,true,.86+q*Math.PI,Math.PI-1.72),new T.MeshStandardMaterial({map:tex,transparent:true,alphaTest:.2,metalness:.2,roughness:.6,emissive:0xffffff,emissiveMap:tex,emissiveIntensity:.25}));m.userData.flat=1;g.add(m)});
     const lbl=arcs(Rg,.6,0,0,v.id,.04,v.c);lbl.forEach(l=>g.add(l));let kk=1;
     return{g,upd:(t)=>{gears[0].rotation.y=t*.45;gears[1].rotation.y=-t*.45;leds.forEach((m,k)=>m.emissiveIntensity=(.15+(Math.sin(t*5-k*1.1)>.2?1:0))*Math.min(kk,1.6))},
      apply:k=>{kk=k;plateGlow(lbl,k)}};
    }

    // B/Hack: 36-hour sprint. A bezel of 36 hour-blocks with a hot sprint timer sweeping around it
    function mkHack(v,R){
     const g=new T.Group(),N=36,H=.8,mats=[],bl=[],dec=[];
     g.add(new T.Mesh(new T.CylinderGeometry(R-.12,R-.12,H,72,1,true),phys({color:0x2a1a16,metalness:.6,roughness:.5,side:T.DoubleSide})));
     [1,-1].forEach(s=>rimTorus(g,R,s,H+.14));
     const bg=new T.BoxGeometry(.3,H,.3);
     for(let i=0;i<N;i++){const a=i/N*Math.PI*2,m=new T.MeshStandardMaterial({color:0x6a2c18,emissive:new T.Color(v.c),emissiveIntensity:.1,metalness:.5,roughness:.35}),b=new T.Mesh(bg,m);
      b.position.set(R*Math.sin(a),0,R*Math.cos(a));b.rotation.y=a;if(i%6===0)b.scale.y=1.18;g.add(b);mats.push(m);bl.push(b);
      const dc=new T.Mesh(new T.PlaneGeometry(.26,.26),new T.MeshBasicMaterial({map:digTex(i+1),transparent:true,depthWrite:false,opacity:.4}));dc.position.set((R+.156)*Math.sin(a),.2,(R+.156)*Math.cos(a));dc.rotation.y=a;dc.userData.flat=1;g.add(dc);dec.push(dc)}
     const lbl=arcs(R,.7,0,0,v.id,.2,v.c);lbl.forEach(l=>g.add(l));let kk=1,hd=0;
     return{g,upd:(t,dt)=>{hd=(hd+dt*5*Math.min(kk,1.6))%N;const head=hd;mats.forEach((m,i)=>{const age=(head-i+N)%N;m.emissiveIntensity=.08+(age<14?(1-age/14)*(.9+Math.max(0,kk-1)*.5):0);bl[i].scale.z=1+Math.max(0,1-age)*.45;dec[i].material.opacity=.35+.65*(age<14?1-age/14:0)})},
      apply:k=>{kk=k;plateGlow(lbl,k)}};
    }

    // B/Dev: open source and web dev. A glass ring carrying a git graph: main line, forking branches and pulsing commits
    function mkDev(v,R){
     const g=new T.Group(),H=1.05,c=new T.Color(v.c);
     g.add(new T.Mesh(new T.CylinderGeometry(R,R,H,80,1,true),phys({color:0x0f2a4a,metalness:.3,roughness:.2,transparent:true,opacity:.55,clearcoat:1,side:T.DoubleSide})));
     [1,-1].forEach(s=>rimTorus(g,R,s,H));
     const lm=new T.MeshStandardMaterial({color:0x111122,emissive:c,emissiveIntensity:.8,roughness:.3});
     const pt=(a,y,r=R+.06)=>new T.Vector3(r*Math.sin(a),y,r*Math.cos(a));
     const tube=(pts,closed,rad)=>g.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts,closed),pts.length*6,rad,8,closed),lm));
     const main=[];for(let i=0;i<64;i++)main.push(pt(i/64*Math.PI*2,0));tube(main,true,.05);
     const br=(a0,a1,s,h)=>{const p=[];for(let i=0;i<=14;i++){const f=i/14;p.push(pt(a0+(a1-a0)*f,s*h*Math.pow(Math.sin(Math.PI*f),.6)))}tube(p,false,.04)};
     br(.95,2.2,1,.34);br(4.05,5.3,-1,.34);br(1.25,1.95,-1,.3);br(4.35,5.0,1,.3);
     const nodes=[];
     [[.95,0],[2.2,0],[4.05,0],[5.3,0],[1.575,.34*.94],[4.675,-.34*.94],[1.6,-.3*.94],[4.675,.3*.94],[1.1,0],[5.7,0],[2.0,0],[4.5,0]].forEach(([a,y])=>{
      const m=lm.clone(),s=new T.Mesh(new T.SphereGeometry(.1,12,10),m);s.position.copy(pt(a,y,R+.07));g.add(s);nodes.push(m)});
     DEV_TXT.forEach((d,q)=>{const m=new T.Mesh(new T.CylinderGeometry(R+.008,R+.008,H,40,1,true,q*Math.PI/2,Math.PI/2),new T.MeshBasicMaterial({map:devTex(d),transparent:true,depthWrite:false}));m.renderOrder=2;m.userData.flat=1;g.add(m)});
     const lbl=arcs(R,.9,0,0,v.id,.16,v.c);lbl.forEach(l=>g.add(l));
     return{g,upd:(t)=>nodes.forEach((m,i)=>m.emissiveIntensity=.5+1.3*Math.max(0,Math.sin(t*3-i*.9))),
      apply:k=>{lm.emissiveIntensity=.8+Math.max(0,k-1)*.6;plateGlow(lbl,k)}};
    }
    const R=[2.3,2.1,2.15,2.3],tilt=[.22,-.2,.2,-.22],mk=[mkAlgo,mkUnit,mkHack,mkDev];
    V.forEach((v,i)=>{
     const b=mk[i](v,R[i]);
     const holder=new T.Group();holder.add(b.g);holder.rotation.z=tilt[i];holder.rotation.x=tilt[i]*.5;
     b.g.traverse(o=>{if(o.isMesh){o.userData.id=v.id;pick.push(o);o.castShadow=!o.userData.flat;o.receiveShadow=true}});
     stack.add(holder);
     bands.push({v,holder,spin:b.g,apply:b.apply,upd:b.upd,y:v.y,lift:0,glow:1,kick:0,dir:i%2?-1:1,off:i*1.3,rot:i*1.7,sp:1,rx:0,rz:0,ox:0});
    });
    // central pole: thick shaft, hex collars with glowing rings, base flange, pulsing finial, gyroscope halos
    const poleMat=phys({color:0x4a4566,metalness:.95,roughness:.28});
    const pole=new T.Mesh(new T.CylinderGeometry(.2,.2,9.8,24),poleMat);pole.position.y=.8;pole.castShadow=true;stack.add(pole);
    const glowMat=c=>new T.MeshStandardMaterial({color:0x111111,emissive:new T.Color(c),emissiveIntensity:.9,roughness:.3});
    [[3.22,0],[1.08,1],[-1.08,2],[-3.22,3]].forEach(([y,i])=>{
     const nut=new T.Mesh(new T.CylinderGeometry(.38,.38,.2,6),rimMat);nut.position.y=y;nut.castShadow=true;stack.add(nut);
     const r=new T.Mesh(new T.TorusGeometry(.4,.035,8,32),glowMat(V[i].c));r.rotation.x=Math.PI/2;r.position.y=y+.12;stack.add(r)});
    const flange=new T.Mesh(new T.CylinderGeometry(.55,.8,.3,32),rimMat);flange.position.y=-3.95;flange.castShadow=true;stack.add(flange);
    const orbMat=new T.MeshStandardMaterial({color:0x111111,emissive:0x67e8f9,emissiveIntensity:1.2,roughness:.2});
    const orb=new T.Mesh(new T.SphereGeometry(.26,24,16),orbMat);orb.position.y=5.85;stack.add(orb);
    const cap=new T.Mesh(new T.TorusGeometry(.42,.04,8,40),rimMat);cap.rotation.x=Math.PI/2;cap.position.y=5.85;stack.add(cap);
    const cursorLight=new T.PointLight(0x67e8f9,0,40,2);scene.add(cursorLight);
    // shockwave ring that pings out from a band when it is selected
    const pingM=new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false}),pingMesh=new T.Mesh(new T.TorusGeometry(2.3,.03,8,96),pingM);pingMesh.rotation.x=Math.PI/2;stack.add(pingMesh);let ping=-1,pingBand=null;

    const ped=new T.Group();ped.position.y=-3.9;scene.add(ped);
    const navy=phys({color:0x25203f,metalness:.8,roughness:.4}),conc=phys({color:0x676a78,metalness:.2,roughness:.75}),inlay=phys({color:0x123a44,emissive:0x67e8f9,emissiveIntensity:.35,metalness:.5,roughness:.3});
    [[3.7,4.1,.3,-.2,navy],[3.45,3.7,.2,-.02,navy],[3.2,3.4,.18,.04,conc]].forEach(([a,b,h,y,m])=>{const d=new T.Mesh(new T.CylinderGeometry(a,b,h,72),m);d.position.y=y;d.castShadow=d.receiveShadow=true;ped.add(d)});
    [3.4,2.6].forEach(r=>{const t=new T.Mesh(new T.TorusGeometry(r,.05,8,128),inlay);t.rotation.x=Math.PI/2;t.position.y=.15;ped.add(t)});
    const ground=new T.Mesh(new T.PlaneGeometry(60,60),new T.ShadowMaterial({opacity:.5}));ground.rotation.x=-Math.PI/2;ground.position.y=-4.25;ground.receiveShadow=true;scene.add(ground);


    // ---------- interaction state ----------
    let hov=null,sel=null,vel=reduce?0:.12,rotY=.6,rotX=0,drag=false,sx=0,sy=0,lx=0,ly0=0,px=0,py=0,push=0;
    let bx=0,by=2.2,bz=18,ly=.3,narrow=false,cz=18,cy=2.2,cly=.3,cox=0,vis=true,raf=0,dead=false,timer=0,last=performance.now(),t=0;
    const ray=new T.Raycaster(),mv=new T.Vector2(),idx=(id)=>V.findIndex((x)=>x.id===id);
    const cleanup=[];
    const on=(tg,n,f,o)=>{tg.addEventListener(n,f,o);cleanup.push(()=>tg.removeEventListener(n,f,o))};
    const setHover=(id)=>{hov=id;api.onHover(id)};
    function choose(id){
     const b=bands[idx(id)];if(!b)return;
     sel=id;hov=id;api.onHover(id);onFocusChange?.(true);
     b.kick=Math.PI*2*b.dir;b.flash=0;ping=0;pingBand=b;pingM.color.set(b.v.c);api.onSelect(id)}
    function closeSel(){if(!sel)return;sel=null;api.onSelect(null);onFocusChange?.(false)}
    const stepSel=(d)=>choose(V[(idx(sel||hov||V[0].id)+d+V.length)%V.length].id);
    api.ctrl={select:choose,close:closeSel,step:stepSel};
    function hit(e){const r=stage.getBoundingClientRect();mv.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1);ray.setFromCamera(mv,cam);const h=ray.intersectObjects(pick,false);return h.length?h[0].object.userData.id:null}
    on(stage,'pointerdown',(e)=>{drag=true;sx=lx=e.clientX;sy=ly0=e.clientY;try{stage.setPointerCapture(e.pointerId)}catch(_){}});
    on(stage,'pointermove',(e)=>{const r=stage.getBoundingClientRect();px=(e.clientX-r.left)/r.width-.5;py=(e.clientY-r.top)/r.height-.5;
     if(!drag)push=Math.max(-.03,Math.min(.03,push+(e.movementX||0)*.0008));
     if(drag){const dx=e.clientX-lx,dy=e.clientY-ly0;lx=e.clientX;ly0=e.clientY;rotY+=dx*.008;vel=dx*.004;if(e.pointerType==='mouse')rotX=Math.max(-.35,Math.min(.35,rotX+dy*.004));return}
     if(e.pointerType==='mouse'&&!sel){const id=hit(e);if(id!==hov)setHover(id)}});
    on(stage,'pointerleave',()=>{px=py=0;if(!drag&&!sel)setHover(null)});
    on(stage,'pointerup',(e)=>{drag=false;if(Math.hypot(e.clientX-sx,e.clientY-sy)<6){const id=hit(e);if(id)choose(id);else if(sel)closeSel();else setHover(null)}});
    on(stage,'pointercancel',()=>{drag=false});
    on(stage,'keydown',(e)=>{
     if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();const d=e.key==='ArrowDown'?1:-1;if(sel){stepSel(d);return}const i=hov?idx(hov)+d:d>0?0:V.length-1;setHover(V[(i+V.length)%V.length].id)}
     else if(e.key==='ArrowLeft'){rotY-=.35}else if(e.key==='ArrowRight'){rotY+=.35}
     else if(e.key==='Enter'||e.key===' '){e.preventDefault();choose(hov||V[0].id)}});

    on(window,'keydown',(e)=>{if(e.key==='Escape')closeSel()});
    function size(){const w=stage.clientWidth||600,h=stage.clientHeight||600;ren.setSize(w,h,false);cam.aspect=w/h;
     narrow=w/h<.9;bx=0;by=narrow?3:2.2;bz=narrow?28:18;ly=narrow?.6:.3;cam.updateProjectionMatrix()}
    function fittedFocusDistance(targetY:number){
     const bounds=new T.Box3().setFromObject(stack),dims=bounds.getSize(new T.Vector3());
     const halfH=Math.max(Math.abs(bounds.max.y-targetY),Math.abs(bounds.min.y-targetY));
     const tanV=Math.tan(T.MathUtils.degToRad(cam.fov/2)),tanH=tanV*cam.aspect;
     const vertical=halfH/Math.max(tanV,.001),horizontal=(dims.x/2)/Math.max(tanH,.001);
     return Math.max(vertical,horizontal)+dims.z*.5;
    }
    const ro=new ResizeObserver(size);ro.observe(stage);size();cz=bz;cy=by;cly=ly;cam.position.set(bx,by,bz);
    const io=new IntersectionObserver((en)=>{vis=en[0].isIntersecting});io.observe(stage);

    function tick(){
     if(dead)return;raf=requestAnimationFrame(tick);
     const now=performance.now(),dt=Math.min(.05,(now-last)/1000);last=now;t+=dt;
     if(!vis||document.hidden)return;
     if(!drag){rotY+=vel*dt+(reduce?0:(sel?.05:.12)*dt);vel*=.94;rotX*=.92}
     stack.rotation.y=rotY;stack.rotation.x=rotX;
     const k=reduce?1:.07,sb=sel?bands[idx(sel)]:null;
     const focusTargetY=sb?sb.y-(narrow?2.2:0):ly;
     const zoomTarget=sb?Math.max(narrow?16:11.5,fittedFocusDistance(focusTargetY)*1.06):bz;
     cz+=(zoomTarget-cz)*k;cy+=((sb?sb.y+1.1:by)-cy)*k;
     cly+=(focusTargetY-cly)*k;
     cox+=((sb&&!narrow?2.4:0)-cox)*k;cam.position.set(cox+(reduce?0:px*.9),cy-(reduce?0:py*.5),cz);cam.lookAt(cox,cly,0);
     const foc=sel||hov,hi=bands.findIndex((x)=>x.v.id===foc),gap=sel?.7:.32;
     bands.forEach((b,bi)=>{const o=foc===b.v.id;
      b.lift+=((o?.12:hi<0?0:bi<hi?gap:-gap)-b.lift)*.12;b.glow+=((o?(sel?1.9:1.6):foc?.6:1)-b.glow)*.12;
      if(b.flash!==undefined){b.flash+=dt;b.glow+=Math.max(0,1-b.flash*2.5);if(b.flash>.5)b.flash=undefined}
      b.kick+=(0-b.kick)*.05;
      const spd=o?.15:foc?1.5:1;b.sp+=(spd-b.sp)*.06;
      if(!reduce)b.rot+=b.dir*(.32*dt+push)*b.sp;
      const fy=reduce?0:Math.sin(t*.9+b.off)*.11;
      b.holder.position.y=b.y+b.lift+fy;
      b.ox+=((reduce?0:px*.35*(bi-1.5))-b.ox)*.08;b.rx+=((reduce?0:py*.22)-b.rx)*.08;b.rz+=((reduce?0:px*.18)-b.rz)*.08;
      b.holder.position.x=b.ox;b.holder.rotation.z=tilt[bi]+b.rz;b.holder.rotation.x=tilt[bi]*.5+b.rx;
      b.spin.rotation.y=b.rot+b.kick;
      b.apply(b.glow);if(b.upd)b.upd(t,dt)});
     const act=sel||hov;
     orb.scale.setScalar(1+(reduce?0:Math.sin(t*2.2)*.07)+(act?.18:0));orbMat.emissiveIntensity=1.2+(act?.8:0);
     cursorLight.position.set(px*16,2-py*10,9);cursorLight.intensity+=((reduce||coarse?0:120)-cursorLight.intensity)*.1;
     if(ping>=0){ping+=dt;const f=Math.min(1,ping/.9);pingMesh.position.y=pingBand.y+pingBand.lift;pingMesh.scale.setScalar(1+f*.55);pingM.opacity=(1-f)*.8;if(f>=1){ping=-1;pingM.opacity=0}}
     push*=.9;
     ren.render(scene,cam)}
    tick();

    return ()=>{
     dead=true;cancelAnimationFrame(raf);clearTimeout(timer);io.disconnect();ro.disconnect();cleanup.forEach((f)=>f());
     scene.traverse((o)=>{o.geometry&&o.geometry.dispose();const m=o.material;(Array.isArray(m)?m:m?[m]:[]).forEach((mm)=>{['map','bumpMap','emissiveMap'].forEach((p)=>mm[p]&&mm[p].dispose());mm.dispose()})});
     scene.environment&&scene.environment.dispose();ren.dispose();ren.domElement.remove()}

}
