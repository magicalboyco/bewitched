import { PIECE_COLORS, UI } from './palette.js';
import { settings } from './settings.js';
import { getGemImage } from './gemImages.js';

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
function star(ctx,x,y,size,alpha=1,glow='#fff1b7',fill='#fff6d7') {
  ctx.save();
  ctx.globalAlpha=alpha;
  ctx.translate(x,y);
  ctx.shadowColor=glow;
  ctx.shadowBlur=size*2.2;
  ctx.fillStyle=fill;
  ctx.beginPath();
  ctx.moveTo(0,-size);
  ctx.quadraticCurveTo(size*.19,-size*.19,size,0);
  ctx.quadraticCurveTo(size*.19,size*.19,0,size);
  ctx.quadraticCurveTo(-size*.19,size*.19,-size,0);
  ctx.quadraticCurveTo(-size*.19,-size*.19,0,-size);
  ctx.fill();
  ctx.restore();
}
// A tapered luminous streak trailing a Comet, always pointing the same
// general direction (gentle sway with t) so it reads as "in motion" even
// when the gem itself is sitting still.
function cometTail(ctx,cx,cy,r,t,hue) {
  const angle=Math.PI*0.22+Math.sin(t*0.6)*0.05;
  const len=r*1.9;
  const tx=cx-Math.cos(angle)*len, ty=cy-Math.sin(angle)*len;
  ctx.save();
  const grad=ctx.createLinearGradient(cx,cy,tx,ty);
  grad.addColorStop(0,hue+'cc');
  grad.addColorStop(0.5,hue+'55');
  grad.addColorStop(1,hue+'00');
  ctx.strokeStyle=grad;
  ctx.lineCap='round';
  ctx.lineWidth=Math.max(1.5,r*0.32);
  ctx.beginPath();
  ctx.moveTo(cx,cy);
  ctx.lineTo(tx,ty);
  ctx.stroke();
  ctx.restore();
}
// Each special kind gets its own halo color and orbiting-star count so
// they read as distinct at a glance: gold Sparks, violet Crystal Balls,
// ember Comets (the 6-in-a-row tier — row + column + color, all at once,
// with an icy white-blue nucleus and a directional tail), coral-gold
// Witchfire (the L/T-shape tier — a 3x3 burst, flame-swirl styling).
const SPECIAL_HUES = {
  'spark-row': '#ffe3a0',
  'spark-col': '#ffe3a0',
  crystalball: '#b9a4ff',
  comet: '#ffb37a',
  witchfire: '#ff9a56',
};
const SPECIAL_COUNTS = { crystalball: 6, comet: 8, witchfire: 5 };
const ICY_CORE = { glow: '#bfeaff', fill: '#eafdff' };
const COMET_TAIL_HUE = '#bfe3ff';
const WITCHFIRE_EMBER = { glow: '#ffcf8a', fill: '#ffd9a0' };

function drawSpecial(ctx,special,cx,cy,r,t) {
  const ball=special==='crystalball';
  const comet=special==='comet';
  const witchfire=special==='witchfire';
  const reduced=settings.reducedMotion;
  const motionT=reduced?0:t; // freeze every t-driven wobble below, not just phase
  const phase=motionT*2.5;
  const pulse=reduced?0.5:.5+.5*Math.sin(phase*2.6);
  const hue=SPECIAL_HUES[special]||'#ffe3a0';
  // Halo sits outside the jewel, not a slash drawn across its artwork.
  ctx.save();
  const halo=ctx.createRadialGradient(cx,cy,r*.36,cx,cy,r*1.55);
  halo.addColorStop(0,hue+'33');
  halo.addColorStop(.72,hue+'22');
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
  if(comet||witchfire){
    // A second, counter-rotating ring for the two rarer tiers.
    ctx.beginPath();ctx.arc(cx,cy,r*1.3,-phase*1.3,-phase*1.3+Math.PI*1.1);ctx.stroke();
  }

  if(comet) cometTail(ctx,cx,cy,r,motionT,COMET_TAIL_HUE);

  const count=SPECIAL_COUNTS[special]||4;
  for(let i=0;i<count;i++){
    const a=phase*(i%2===0?1:-.75)+i*2*Math.PI/count;
    const d=r*(1.12+.1*Math.sin(motionT*3+i));
    const size=r*(SPECIAL_COUNTS[special]?.12:.10)*(0.72+0.28*Math.sin(motionT*4+i*2)**2);
    const alpha=.62+.38*pulse;
    if(witchfire && i%2===1){
      // Alternate coral and ember-gold glints for a two-tone flame swirl.
      star(ctx,cx+Math.cos(a)*d,cy+Math.sin(a)*d,size,alpha,WITCHFIRE_EMBER.glow,WITCHFIRE_EMBER.fill);
    } else {
      star(ctx,cx+Math.cos(a)*d,cy+Math.sin(a)*d,size,alpha);
    }
  }
  if(!comet) star(ctx,cx-r*.3,cy-r*.4,r*(ball?.24:.17),.45+.55*pulse);
  if(ball){
    ctx.strokeStyle='#f7dfff';
    ctx.lineWidth=Math.max(1,r*.05);
    ctx.globalAlpha=.5+.4*pulse;
    ctx.beginPath();ctx.arc(cx,cy,r*.68,0,Math.PI*2);ctx.stroke();
    star(ctx,cx+r*.12,cy-r*.06,r*.24,.75+.25*pulse);
  } else if(comet){
    // Icy white-blue nucleus — the "biggest" special on the board, and
    // identifiable by its cool core + tail even with motion reduced.
    star(ctx,cx,cy,r*.32,.85+.15*pulse,ICY_CORE.glow,ICY_CORE.fill);
  }
  ctx.restore();
}
// Spark Charms share one halo art regardless of orientation, so a small
// gold arrow glyph is layered on top to show which way they'll fire —
// without it, row- and column-clearing charms are visually identical.
function drawDirectionGlyph(ctx, special, cx, cy, r) {
  if (special !== 'spark-row' && special !== 'spark-col') return;
  const horizontal = special === 'spark-row';
  ctx.save();
  ctx.translate(cx, cy + r * 0.74);
  if (!horizontal) ctx.rotate(Math.PI / 2);
  ctx.strokeStyle = '#2b203a';
  ctx.lineWidth = Math.max(1.4, r * 0.1);
  ctx.lineCap = 'round';
  ctx.globalAlpha = 0.85;
  const w = r * 0.5;
  ctx.beginPath();
  ctx.moveTo(-w, 0);
  ctx.lineTo(w, 0);
  ctx.moveTo(-w, 0);
  ctx.lineTo(-w + r * 0.16, -r * 0.14);
  ctx.moveTo(-w, 0);
  ctx.lineTo(-w + r * 0.16, r * 0.14);
  ctx.moveTo(w, 0);
  ctx.lineTo(w - r * 0.16, -r * 0.14);
  ctx.moveTo(w, 0);
  ctx.lineTo(w - r * 0.16, r * 0.14);
  ctx.stroke();
  ctx.restore();
}

// If assets/gems/<id>.svg has loaded (see gemImages.js — provided by the
// art/audio collaborator, integrated here once available), draw that
// instead of the procedural jewel. Falls straight through to the
// procedural gem otherwise, so this is a safe no-op until those assets
// exist and are wired in via loadGemImages().
function drawGem(ctx, type, cx, cy, r) {
  const img = getGemImage(type.id);
  if (!img) {
    drawJewel(ctx, type, cx, cy, r);
    return;
  }
  // r is already ~0.39 * cellSize (see render.js), so r*2.3 lands close to
  // the manifest's suggested `cellSize * 0.90` starting point.
  const size = r * 2.3;
  ctx.save();
  ctx.shadowColor = 'rgba(9,4,21,.5)';
  ctx.shadowBlur = r * 0.3;
  ctx.shadowOffsetY = r * 0.2;
  ctx.drawImage(img, cx - size / 2, cy - size / 2, size, size);
  ctx.restore();
}

/**
 * Seven gems, each either the procedural geometry-based cut below or,
 * once supplied, external artwork (see drawGem). Special pieces glow,
 * pulse, and emit orbiting animated stars regardless of which art is used.
 */
export function drawPiece(ctx,typeId,cx,cy,r,{special=null,glowT=0}={}) {
  const type=BY_ID[typeId];if(!type)return;
  if(special){
    const reduced=settings.reducedMotion;
    ctx.save();
    ctx.shadowColor=SPECIAL_HUES[special]||'#ffe3a0';
    ctx.shadowBlur=reduced?r*.5:r*(.6+.45*Math.sin(glowT*3)**2);
    drawGem(ctx,type,cx,cy,r);
    ctx.restore();
    drawSpecial(ctx,special,cx,cy,r,glowT);
    drawDirectionGlyph(ctx,special,cx,cy,r);
  }else {
    drawGem(ctx,type,cx,cy,r);
  }
}
