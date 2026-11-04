import { PIECE_COLORS, UI } from './palette.js';

// Keep stable IDs because the match-three engine stores these in its board.
export const PIECE_TYPES = [
  { id: 'amethyst', name: 'Lavender Amethyst', color: PIECE_COLORS.lavender, shape: 'oval' },
  { id: 'moonstone', name: 'Teal Princess', color: PIECE_COLORS.teal, shape: 'princess' },
  { id: 'herb', name: 'Verdant Emerald', color: PIECE_COLORS.lime, shape: 'emerald' },
  { id: 'star', name: 'Sun Citrine', color: PIECE_COLORS.yellow, shape: 'round' },
  { id: 'marigold', name: 'Amber Cushion', color: PIECE_COLORS.orange, shape: 'cushion' },
  { id: 'potion', name: 'Rose Pear', color: PIECE_COLORS.coral, shape: 'pear' },
  { id: 'crescent', name: 'Periwinkle Marquise', color: PIECE_COLORS.periwinkle, shape: 'marquise' },
];
const BY_ID = Object.fromEntries(PIECE_TYPES.map(p => [p.id, p]));
export const typeById = id => BY_ID[id];

function pointPath(ctx, points) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
}
function polygon(n, rotation = 0, rx = 1, ry = 1) {
  return Array.from({length:n}, (_,i) => {
    const a = i * Math.PI * 2/n + rotation;
    return [Math.cos(a)*rx, Math.sin(a)*ry];
  });
}
const SHAPES = {
  oval: polygon(12, -Math.PI/2, 0.68, 1.05),
  princess: [[-.76,-.76],[.76,-.76],[.76,.76],[-.76,.76]],
  emerald: [[-.45,-1.03],[.45,-1.03],[.76,-.7],[.76,.7],[.45,1.03],[-.45,1.03],[-.76,.7],[-.76,-.7]],
  round: polygon(12,-Math.PI/2,.94,.94),
  cushion: [[-.54,-.88],[.54,-.88],[.87,-.55],[.87,.55],[.54,.88],[-.54,.88],[-.87,.55],[-.87,-.55]],
  pear: [[0,-1.13],[.27,-.8],[.47,-.49],[.66,-.06],[.70,.37],[.53,.76],[.25,1.00],[0,1.04],[-.25,1.00],[-.53,.76],[-.70,.37],[-.66,-.06],[-.47,-.49],[-.27,-.8]],
  marquise: [[0,-1.15],[.36,-.84],[.59,-.45],[.68,0],[.59,.45],[.36,.84],[0,1.15],[-.36,.84],[-.59,.45],[-.68,0],[-.59,-.45],[-.36,-.84]],
};
function mapPoints(pts,cx,cy,r) { return pts.map(([x,y]) => [cx+x*r,cy+y*r]); }
function colorShift(hex, amount) {
  const n = parseInt(hex.slice(1),16);
  const c = [n>>16,(n>>8)&255,n&255].map(v=>Math.max(0,Math.min(255,Math.round(v+amount))));
  return 'rgb('+c.join(',')+')';
}
function fillPolygon(ctx, pts, color, alpha = 1) {
  ctx.save(); ctx.globalAlpha = alpha; pointPath(ctx,pts); ctx.fillStyle=color; ctx.fill();ctx.restore();
}
function facet(ctx, pts, indices, c, alpha) {
  fillPolygon(ctx, indices.map(i=>pts[i]),c,alpha);
}
function drawJewel(ctx,type,cx,cy,r) {
  const unit = SHAPES[type.shape];
  const pts = mapPoints(unit,cx,cy,r);
  ctx.save();
  ctx.shadowColor='rgba(9,4,21,.5)';
  ctx.shadowBlur=r*.3;
  ctx.shadowOffsetY=r*.2;
  pointPath(ctx,pts);
  ctx.fillStyle=type.color;
  ctx.fill();
  ctx.restore();

  // Three-dimensional jewel body; all facets are clipped to the actual cut.
  ctx.save();
  pointPath(ctx,pts);ctx.clip();
  const gradient=ctx.createLinearGradient(cx-r,cy-r,cx+r,cy+r);
  gradient.addColorStop(0,colorShift(type.color,67));
  gradient.addColorStop(.3,colorShift(type.color,20));
  gradient.addColorStop(.67,type.color);
  gradient.addColorStop(1,colorShift(type.color,-53));
  ctx.fillStyle=gradient;
  ctx.fillRect(cx-r*1.3,cy-r*1.3,r*2.6,r*2.6);

  const inset=mapPoints(unit,cx,cy,r*.7);
  for (let i=0;i<pts.length;i++) {
    const a=pts[i],b=pts[(i+1)%pts.length];
    const v1=inset[i],v2=inset[(i+1)%pts.length];
    fillPolygon(ctx,[a,b,v2,v1],i%3===0 ? '#fff' : '#130f30',i%3===0 ? .20 : i%3===1 ? .1 : .16);
  }
  // Cut table and angular pavilion facets.
  const table=mapPoints(unit,cx,cy,r*.43);
  fillPolygon(ctx,table,'#ffffff',.19);
  for(let i=0;i<pts.length;i++){
    const a=inset[i],b=inset[(i+1)%pts.length];
    fillPolygon(ctx,[a,b,[cx,cy]],i%2===0?'#ffffff':'#17214c',i%2===0?.13:.10);
  }
  fillPolygon(ctx,table,type.color,.35);
  ctx.strokeStyle='rgba(255,255,255,.32)';
  ctx.lineWidth=Math.max(.7,r*.027);
  pointPath(ctx,inset);ctx.stroke();
  pointPath(ctx,table);ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(cx-r*.31,cy-r*.35,r*.15,r*.07,-.55,0,Math.PI*2);
  ctx.fillStyle='rgba(255,255,255,.78)';ctx.fill();
  ctx.restore();

  ctx.save();
  pointPath(ctx,pts);
  ctx.strokeStyle=colorShift(type.color,-69);
  ctx.lineWidth=Math.max(1.25,r*.055);
  ctx.lineJoin='round';ctx.stroke();
  ctx.restore();
}
function star(ctx,x,y,size,alpha=1) {
  ctx.save();
  ctx.globalAlpha=alpha;
  ctx.translate(x,y);
  ctx.shadowColor='#fff1b7';
  ctx.shadowBlur=size*2.2;
  ctx.fillStyle='#fff6d7';
  ctx.beginPath();
  ctx.moveTo(0,-size);
  ctx.quadraticCurveTo(size*.19,-size*.19,size,0);
  ctx.quadraticCurveTo(size*.19,size*.19,0,size);
  ctx.quadraticCurveTo(-size*.19,size*.19,-size,0);
  ctx.quadraticCurveTo(-size*.19,-size*.19,0,-size);
  ctx.fill();
  ctx.restore();
}
function drawSpecial(ctx,special,cx,cy,r,t) {
  const ball=special==='crystalball';
  const phase=t*2.5;
  const pulse=.5+.5*Math.sin(phase*2.6);
  const hue=ball?'#b9a4ff':'#ffe3a0';
  // Halo sits outside the jewel, not a slash drawn across its artwork.
  ctx.save();
  const halo=ctx.createRadialGradient(cx,cy,r*.36,cx,cy,r*1.55);
  halo.addColorStop(0,ball?'rgba(206,178,255,.20)':'rgba(255,226,150,.20)');
  halo.addColorStop(.72,ball?'rgba(166,125,255,.15)':'rgba(255,218,115,.13)');
  halo.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=halo;
  ctx.globalAlpha=.73+pulse*.27;
  ctx.beginPath();ctx.arc(cx,cy,r*1.55,0,Math.PI*2);ctx.fill();

  ctx.strokeStyle=hue;
  ctx.lineWidth=Math.max(1.3,r*.055);
  ctx.shadowColor=hue;
  ctx.shadowBlur=r*(.38+pulse*.42);
  ctx.globalAlpha=.55+pulse*.4;
  ctx.beginPath();ctx.arc(cx,cy,r*1.12,phase,phase+Math.PI*1.35);ctx.stroke();

  const count=ball?6:4;
  for(let i=0;i<count;i++){
    const a=phase*(i%2===0?1:-.75)+i*2*Math.PI/count;
    const d=r*(1.12+.1*Math.sin(t*3+i));
    const size=r*(ball?.12:.10)*(0.72+0.28*Math.sin(t*4+i*2)**2);
    star(ctx,cx+Math.cos(a)*d,cy+Math.sin(a)*d,size,.62+.38*pulse);
  }
  star(ctx,cx-r*.3,cy-r*.4,r*(ball?.24:.17),.45+.55*pulse);
  if(ball){
    ctx.strokeStyle='#f7dfff';
    ctx.lineWidth=Math.max(1,r*.05);
    ctx.globalAlpha=.5+.4*pulse;
    ctx.beginPath();ctx.arc(cx,cy,r*.68,0,Math.PI*2);ctx.stroke();
    star(ctx,cx+r*.12,cy-r*.06,r*.24,.75+.25*pulse);
  }
  ctx.restore();
}
/**
 * No faces or stock art: seven original geometry-based polished gems.
 * Special pieces glow, pulse, and emit orbiting animated four-point stars.
 */
export function drawPiece(ctx,typeId,cx,cy,r,{special=null,glowT=0}={}) {
  const type=BY_ID[typeId];if(!type)return;
  if(special){
    ctx.save();
    ctx.shadowColor=special==='crystalball'?'#b9a4ff':'#ffe3a0';
    ctx.shadowBlur=r*(.6+.45*Math.sin(glowT*3)**2);
    drawJewel(ctx,type,cx,cy,r);
    ctx.restore();
    drawSpecial(ctx,special,cx,cy,r,glowT);
  }else {
    drawJewel(ctx,type,cx,cy,r);
  }
}
