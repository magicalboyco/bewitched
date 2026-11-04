import { PIECE_COLORS, UI } from './palette.js';

// Seven board pieces, each a distinct silhouette so colorblind players can
// still tell types apart. Shapes are drawn procedurally as glossy gems (no
// image assets).
export const PIECE_TYPES = [
  { id: 'amethyst', name: 'Amethyst Shard', color: PIECE_COLORS.lavender, shape: 'spike' },
  { id: 'moonstone', name: 'Moonstone', color: PIECE_COLORS.teal, shape: 'hex' },
  { id: 'herb', name: "Witch's Herb", color: PIECE_COLORS.lime, shape: 'clover' },
  { id: 'star', name: 'Star Charm', color: PIECE_COLORS.yellow, shape: 'star' },
  { id: 'marigold', name: 'Marigold Bloom', color: PIECE_COLORS.orange, shape: 'flower' },
  { id: 'potion', name: 'Love Potion', color: PIECE_COLORS.coral, shape: 'droplet' },
  { id: 'crescent', name: 'Crescent Charm', color: PIECE_COLORS.periwinkle, shape: 'crescent' },
];

const BY_ID = Object.fromEntries(PIECE_TYPES.map((p) => [p.id, p]));
export const typeById = (id) => BY_ID[id];

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + amt));
  const b = Math.max(0, Math.min(255, (n & 0xff) + amt));
  return `rgb(${r},${g},${b})`;
}

// --- path tracers: build a canvas path only, no fill/stroke -----------

function traceSpike(ctx, cx, cy, r) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - r * 1.15);
  ctx.lineTo(cx + r * 0.55, cy - r * 0.2);
  ctx.lineTo(cx + r * 0.4, cy + r * 0.95);
  ctx.lineTo(cx - r * 0.4, cy + r * 0.95);
  ctx.lineTo(cx - r * 0.55, cy - r * 0.2);
  ctx.closePath();
}

function traceHex(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function traceClover(ctx, cx, cy, r) {
  const lobeR = r * 0.52;
  const offs = [
    [0, -r * 0.42],
    [r * 0.42, r * 0.2],
    [-r * 0.42, r * 0.2],
  ];
  ctx.beginPath();
  offs.forEach(([dx, dy]) => {
    ctx.moveTo(cx + dx + lobeR, cy + dy);
    ctx.arc(cx + dx, cy + dy, lobeR, 0, Math.PI * 2);
  });
  // stem, as a thin rounded rect merged into the path
  const sw = r * 0.16;
  ctx.moveTo(cx - sw, cy + r * 0.25);
  ctx.lineTo(cx + sw, cy + r * 0.25);
  ctx.lineTo(cx + sw, cy + r * 0.95);
  ctx.lineTo(cx - sw, cy + r * 0.95);
  ctx.closePath();
}

function traceStar(ctx, cx, cy, r) {
  const spikes = 5;
  const outerR = r;
  const innerR = r * 0.46;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const a = (Math.PI / spikes) * i - Math.PI / 2;
    const rad = i % 2 === 0 ? outerR : innerR;
    const x = cx + Math.cos(a) * rad;
    const y = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function traceFlower(ctx, cx, cy, r) {
  const petals = 6;
  const petalR = r * 0.4;
  ctx.beginPath();
  for (let i = 0; i < petals; i++) {
    const a = (Math.PI * 2 * i) / petals;
    const px = cx + Math.cos(a) * r * 0.5;
    const py = cy + Math.sin(a) * r * 0.5;
    ctx.moveTo(px + petalR, py);
    ctx.arc(px, py, petalR, 0, Math.PI * 2);
  }
  ctx.moveTo(cx + r * 0.42, cy);
  ctx.arc(cx, cy, r * 0.42, 0, Math.PI * 2);
  ctx.closePath();
}

function traceDroplet(ctx, cx, cy, r) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.bezierCurveTo(cx + r * 0.95, cy + r * 0.1, cx + r * 0.6, cy + r, cx, cy + r);
  ctx.bezierCurveTo(cx - r * 0.6, cy + r, cx - r * 0.95, cy + r * 0.1, cx, cy - r);
  ctx.closePath();
}

function traceCrescent(ctx, cx, cy, r) {
  ctx.beginPath();
  // outer disc, clockwise
  ctx.arc(cx, cy, r, 0, Math.PI * 2, false);
  // "bite" disc, opposite winding carves a hole under the nonzero fill rule
  const bx = cx + r * 0.42;
  const by = cy - r * 0.12;
  const br = r * 0.82;
  ctx.moveTo(bx + br, by);
  ctx.arc(bx, by, br, 0, Math.PI * 2, true);
}

const TRACERS = {
  spike: traceSpike,
  hex: traceHex,
  clover: traceClover,
  star: traceStar,
  flower: traceFlower,
  droplet: traceDroplet,
  crescent: traceCrescent,
};

/**
 * Render one piece as a glossy, beveled gem: drop shadow, diagonal gradient
 * fill, dark facet outline, and a soft specular highlight clipped to the
 * shape.
 */
function renderGem(ctx, trace, cx, cy, r, color) {
  // drop shadow
  ctx.save();
  ctx.shadowColor = 'rgba(10,6,20,0.5)';
  ctx.shadowBlur = r * 0.4;
  ctx.shadowOffsetY = r * 0.16;
  trace(ctx, cx, cy, r);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();

  // bevel gradient fill
  const grad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  grad.addColorStop(0, shade(color, 85));
  grad.addColorStop(0.45, color);
  grad.addColorStop(1, shade(color, -55));
  trace(ctx, cx, cy, r);
  ctx.fillStyle = grad;
  ctx.fill();

  // facet outline
  trace(ctx, cx, cy, r);
  ctx.lineWidth = Math.max(1.1, r * 0.055);
  ctx.strokeStyle = shade(color, -90);
  ctx.globalAlpha = 0.85;
  ctx.stroke();
  ctx.globalAlpha = 1;

  // specular highlight, clipped to the gem's own silhouette
  ctx.save();
  trace(ctx, cx, cy, r);
  ctx.clip();

  const sheen = ctx.createRadialGradient(
    cx - r * 0.32, cy - r * 0.42, r * 0.04,
    cx - r * 0.32, cy - r * 0.42, r * 1.05
  );
  sheen.addColorStop(0, 'rgba(255,255,255,0.8)');
  sheen.addColorStop(0.35, 'rgba(255,255,255,0.22)');
  sheen.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sheen;
  ctx.beginPath();
  ctx.arc(cx - r * 0.3, cy - r * 0.42, r * 1.05, 0, Math.PI * 2);
  ctx.fill();

  // tight glint
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.4, cy - r * 0.5, r * 0.16, r * 0.09, -0.5, 0, Math.PI * 2);
  ctx.fill();

  // cool reflected light at the lower-right edge
  const rim = ctx.createRadialGradient(
    cx + r * 0.5, cy + r * 0.55, r * 0.05,
    cx + r * 0.5, cy + r * 0.55, r * 0.8
  );
  rim.addColorStop(0, 'rgba(20,10,35,0.25)');
  rim.addColorStop(1, 'rgba(20,10,35,0)');
  ctx.fillStyle = rim;
  ctx.beginPath();
  ctx.arc(cx + r * 0.5, cy + r * 0.55, r * 0.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Draw one board piece, optionally wearing a special-power overlay.
 * special: null | 'spark-row' | 'spark-col' | 'crystalball'
 */
export function drawPiece(ctx, typeId, cx, cy, r, { special = null, glowT = 0 } = {}) {
  const type = BY_ID[typeId];
  if (!type) return;
  const trace = TRACERS[type.shape] || traceHex;

  if (special) {
    const pulse = 0.5 + 0.5 * Math.sin(glowT * 6);
    ctx.save();
    ctx.shadowColor = UI.gold;
    ctx.shadowBlur = r * (0.7 + pulse * 0.7);
    renderGem(ctx, trace, cx, cy, r, type.color);
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = UI.gold;
    ctx.globalAlpha = 0.85;
    ctx.lineWidth = Math.max(1.5, r * 0.08);
    ctx.setLineDash([r * 0.22, r * 0.16]);
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.22, glowT * 1.2, glowT * 1.2 + Math.PI * 1.7);
    ctx.stroke();
    ctx.restore();
  } else {
    renderGem(ctx, trace, cx, cy, r, type.color);
  }

  if (special === 'spark-row' || special === 'spark-col') {
    ctx.save();
    ctx.strokeStyle = UI.gold;
    ctx.lineWidth = Math.max(2, r * 0.12);
    ctx.lineCap = 'round';
    ctx.shadowColor = UI.gold;
    ctx.shadowBlur = r * 0.3;
    ctx.beginPath();
    if (special === 'spark-row') {
      ctx.moveTo(cx - r * 0.95, cy);
      ctx.lineTo(cx + r * 0.95, cy);
    } else {
      ctx.moveTo(cx, cy - r * 0.95);
      ctx.lineTo(cx, cy + r * 0.95);
    }
    ctx.stroke();
    ctx.restore();
  } else if (special === 'crystalball') {
    ctx.save();
    ctx.strokeStyle = UI.gold;
    ctx.lineWidth = Math.max(1.5, r * 0.07);
    ctx.shadowColor = UI.gold;
    ctx.shadowBlur = r * 0.3;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}
