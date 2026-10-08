import { useEffect, useRef } from 'react';
import { PHI, RADII } from '../../docs/living-hex.mjs';

const TAU = Math.PI * 2;
const setCanvasSize = canvas => {
  const width = Math.max(270, canvas.clientWidth);
  const height = Math.max(300, canvas.clientHeight);
  const scale = Math.min(2, window.devicePixelRatio || 1);
  const w = Math.round(width * scale), h = Math.round(height * scale);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w; canvas.height = h;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  return { ctx, width, height };
};
function point3d(point, yaw, pitch, width, height) {
  const [x, y, z] = point;
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  const x1 = x * cy - z * sy, z1 = x * sy + z * cy;
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  const y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp;
  const perspective = 3.9 / (3.9 - z2);
  const scale = Math.min(width * .31, height * .27) * perspective;
  return { x: width / 2 + x1 * scale, y: height / 2 - y2 * scale, depth: z2 };
}

export function PyramidScene({ frame, selected, running, spin, onSpin }) {
  const ref = useRef(null);
  const state = useRef({ yaw: .26, pitch: .14, dragging: false, x: 0, y: 0 });
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let raf, disposed = false;
    const points = Array.from({ length: 6 }, (_, i) => {
      const a = (i / 6) * TAU;
      return [Math.cos(a), 0, Math.sin(a)];
    });
    points.push([0, PHI, 0], [0, -PHI, 0]);
    const faces = [];
    for (let i = 0; i < 6; i++) {
      faces.push([6, i, (i + 1) % 6, 'top']);
      faces.push([7, (i + 1) % 6, i, 'bottom']);
    }
    let previous = 0;
    const draw = time => {
      if (disposed) return;
      const settings = setCanvasSize(canvas);
      if (settings) {
        const {ctx, width:w, height:h} = settings;
        const delta = previous ? Math.min((time - previous) / 1000, .05) : 0;
        previous = time;
        if (spin && !state.current.dragging) state.current.yaw += .15 * delta;
        ctx.clearRect(0, 0, w, h);
        const projected = points.map(p => point3d(p, state.current.yaw, state.current.pitch, w, h));
        const cx = w / 2, cy = h / 2;
        const baseRadius = Math.min(w * .39, h * .43);
        ctx.save();
        for (const factor of [1, .73, .48]) {
          ctx.beginPath();
          ctx.arc(cx, cy, baseRadius * factor, 0, TAU);
          ctx.strokeStyle = 'rgba(109,196,218,' + (.09 * factor) + ')';
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 8]);
          ctx.stroke();
        }
        ctx.setLineDash([]);
        const glow = ctx.createRadialGradient(cx, cy, 5, cx, cy, baseRadius);
        glow.addColorStop(0, 'rgba(79,161,194,.09)');
        glow.addColorStop(1, 'rgba(79,161,194,0)');
        ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
        const sortedFaces = faces.slice().sort((a, b) =>
          (projected[a[0]].depth + projected[a[1]].depth + projected[a[2]].depth) -
          (projected[b[0]].depth + projected[b[1]].depth + projected[b[2]].depth)
        );
        for (const face of sortedFaces) {
          const [a,b,c,half] = face;
          ctx.beginPath();
          ctx.moveTo(projected[a].x, projected[a].y);
          ctx.lineTo(projected[b].x, projected[b].y);
          ctx.lineTo(projected[c].x, projected[c].y);
          ctx.closePath();
          ctx.fillStyle = half === 'top' ? 'rgba(51,163,201,.07)' : 'rgba(233,168,94,.067)';
          ctx.fill();
          ctx.strokeStyle = half === 'top' ? 'rgba(110,218,236,.42)' : 'rgba(241,180,111,.40)';
          ctx.lineWidth = 1.15; ctx.stroke();
        }
        for (let i = 0; i < 6; i++) {
          const a = projected[i], b = projected[(i + 1) % 6];
          ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y);
          ctx.lineWidth = 1.8; ctx.strokeStyle = 'rgba(207,232,238,.60)'; ctx.stroke();
          ctx.beginPath(); ctx.arc(a.x,a.y,3,0,TAU);
          ctx.fillStyle = '#a6dfe9'; ctx.fill();
        }
        const upper = Math.floor(selected / 6), lower = selected % 6;
        for (const [p,q,color] of [[6,upper,'#6ce4ef'],[lower,7,'#ffcd8d']]) {
          const a=projected[p],b=projected[q];
          ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y);
          ctx.strokeStyle=color; ctx.lineWidth=3;ctx.shadowBlur=15;ctx.shadowColor=color;ctx.stroke();
          ctx.shadowBlur=0;
          const fraction = running ? ((time * .00024) % 1) : (.18 + frame.step / 32);
          ctx.beginPath();ctx.arc(a.x+(b.x-a.x)*fraction,a.y+(b.y-a.y)*fraction,5,0,TAU);
          ctx.fillStyle=color;ctx.shadowBlur=18;ctx.shadowColor=color;ctx.fill();ctx.shadowBlur=0;
        }
        for (const [idx,label,color] of [[6,'ABOVE','#79d7ec'],[7,'BELOW','#efbc86']]) {
          const p=projected[idx];
          ctx.beginPath();ctx.arc(p.x,p.y,5,0,TAU);ctx.fillStyle=color;ctx.fill();
          ctx.font='600 11px system-ui';ctx.fillStyle=color;ctx.fillText(label,p.x+11,p.y-9);
        }
        ctx.fillStyle='rgba(182,202,215,.68)';
        ctx.font='11px system-ui';
        ctx.textAlign='center';
        ctx.fillText('HEXAGONAL BIPYRAMID  ·  8V / 18E / 12F', w/2, h-22);
        ctx.restore();
      }
      raf = requestAnimationFrame(draw);
    };
    raf=requestAnimationFrame(draw);
    return () => {disposed=true;cancelAnimationFrame(raf);};
  }, [frame.step, selected, running, spin]);
  useEffect(() => {
    const canvas=ref.current;
    if (!canvas) return;
    function down(e) {state.current.dragging=true;state.current.x=e.clientX;state.current.y=e.clientY;canvas.setPointerCapture(e.pointerId);}
    function move(e) {if (!state.current.dragging) return; const dx=e.clientX-state.current.x,dy=e.clientY-state.current.y;
      state.current.yaw+=dx*.009;state.current.pitch=Math.max(-.95,Math.min(.95,state.current.pitch+dy*.006));
      state.current.x=e.clientX;state.current.y=e.clientY;}
    function up(e) {state.current.dragging=false;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);}
    canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);
    return()=>{canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);};
  }, []);
  return <div className="pyramid-container"><canvas ref={ref} aria-label="Rotatable hexagonal bipyramid with two highlighted synthetic signal pathways" role="img" className="pyramid-canvas" /><button className="float-button" onClick={()=>onSpin(!spin)} type="button">{spin?'◉ Rotation on':'◎ Rotation off'}</button><div className="scene-corner">Φ / GOLDEN HEIGHT</div></div>;
}

const getPositions=(w,h)=>{
  const cx=w/2,cy=h/2,rmax=Math.min(w,h)*.43;
  return Array.from({length:36},(_,k)=>{
    const upper=Math.floor(k/6),lower=k%6;
    const r=rmax*(.12+.88*RADII[upper]/13);
    const a=-Math.PI/2+lower*Math.PI/3+upper*Math.PI/36;
    return [cx+r*Math.cos(a),cy+r*Math.sin(a)];
  });
};

export function NexusScene({ frame, selected, onSelect, peers, budget }) {
  const ref=useRef(null);
  const positions=useRef([]);
  useEffect(()=>{
    const canvas=ref.current;if(!canvas)return;
    const paint=()=>{
      const sizes=setCanvasSize(canvas);if(!sizes)return;
      const {ctx,width:w,height:h}=sizes;
      const pos=getPositions(w,h);positions.current=pos;
      const cx=w/2,cy=h/2;
      ctx.clearRect(0,0,w,h);
      ctx.lineWidth=1;
      for(let u=5;u>=0;u--){
        ctx.beginPath();
        for(let l=0;l<6;l++){
          const [x,y]=pos[u*6+l];if(!l)ctx.moveTo(x,y);else ctx.lineTo(x,y);
        }
        ctx.closePath();ctx.strokeStyle='rgba(97,207,226,'+(.16+u*.045)+')';ctx.stroke();
      }
      ctx.beginPath();
      for(const [x,y] of pos){ctx.moveTo(cx,cy);ctx.lineTo(x,y);}
      ctx.strokeStyle='rgba(230,191,126,.23)';ctx.stroke();
      ctx.beginPath();
      const n=Math.max(0,Math.min(peers.length,budget-36));
      for(let k=0;k<n;k++){
        const [i,j]=peers[k];ctx.moveTo(...pos[i]);ctx.lineTo(...pos[j]);
      }
      ctx.lineWidth=.7;
      ctx.strokeStyle='rgba(95,173,205,'+(n>400?.075:.125)+')';ctx.stroke();
      frame.channels.forEach((ch,k)=>{
        const [x,y]=pos[k],r=3.1+ch.activity*5.1;
        if(ch.flagged){
          ctx.beginPath();ctx.arc(x,y,r+5,0,TAU);ctx.strokeStyle='rgba(255,147,112,.7)';ctx.lineWidth=2;ctx.stroke();
        }
        ctx.beginPath();ctx.arc(x,y,r,0,TAU);
        ctx.fillStyle=ch.flagged?'#ff936e':'#66d7e7';ctx.fill();
        if(k===selected){
          ctx.beginPath();ctx.arc(x,y,r+8,0,TAU);
          ctx.strokeStyle='#ffe0a1';ctx.lineWidth=2;ctx.stroke();
        }
      });
      ctx.beginPath();ctx.arc(cx,cy,frame.gate.alert?11:8,0,TAU);
      ctx.fillStyle=frame.gate.alert?'#ff936e':'#f2c381';ctx.fill();
      ctx.font='600 11px system-ui';ctx.textAlign='center';
      ctx.fillStyle='rgba(180,209,224,.76)';
      ctx.fillText('6 FIBONACCI RINGS · 36 CHANNEL NODES',cx,h-15);
    };
    paint();
    const observer=new ResizeObserver(paint);observer.observe(canvas);
    return()=>observer.disconnect();
  },[frame,selected,peers,budget]);
  useEffect(()=>{
    const canvas=ref.current;if(!canvas)return;
    const handler=event=>{
      const rect=canvas.getBoundingClientRect(),x=event.clientX-rect.left,y=event.clientY-rect.top;
      let best=-1,dist=Infinity;
      positions.current.forEach(([px,py],k)=>{
        const d=Math.hypot(x-px,y-py);if(d<dist){best=k;dist=d;}
      });
      if(best>=0&&dist<=20)onSelect(best);
    };
    canvas.addEventListener('click',handler);
    return()=>canvas.removeEventListener('click',handler);
  },[onSelect]);
  return <div className="nexus-container"><canvas ref={ref} role="img" aria-label="Thirty-six synthetic channel nodes on six Fibonacci-relative rings; select a node to inspect it" className="nexus-canvas"/><div className="scene-corner">36 GATE + {Math.min(peers.length,budget-36)} PEER LINKS</div></div>;
}
