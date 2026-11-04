import { PIECE_COLORS, UI } from './palette.js';

// Seven board pieces, each a distinct silhouette so colorblind players can
// still tell types apart. Shapes are drawn procedurally (no image assets).
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

function polygon(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
}

function outline(ctx, r) {
  ctx.lineWidth = Math.max(2, r * 0.1);
  ctx.strokeStyle = UI.charcoalViolet;
  ctx.stroke();
}

function drawSpike(ctx, cx, cy, r, color) {
  const pts = [
    [cx, cy - r * 1.15],
    [cx + r * 0.55, cy - r * 0.2],
    [cx + r * 0.4, cy + r * 0.95],
    [cx - r * 0.4, cy + r * 0.95],
    [cx - r * 0.55, cy - r * 0.2],
  ];
  polygon(ctx, pts);
  ctx.fillStyle = color;
  ctx.fill();
  outline(ctx, r);
  // facet highlight
  ctx.beginPath();
  ctx.moveTo(cx, cy - r * 1.15);
  ctx.lineTo(cx + r * 0.1, cy + r * 0.95);
  ctx.lineTo(cx - r * 0.4, cy + r * 0.95);
  ctx.closePath();
  ctx.fillStyle = shade(color, -25);
  ctx.globalAlpha = 0.35;
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawHex(ctx, cx, cy, r, color) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  polygon(ctx, pts);
  ctx.fillStyle = color;
  ctx.fill();
  outline(ctx, r);
}

function drawClover(ctx, cx, cy, r, color) {
  const lobeR = r * 0.52;
  const offs = [
    [0, -r * 0.42],
    [r * 0.42, r * 0.2],
    [-r * 0.42, r * 0.2],
  ];
  ctx.fillStyle = color;
  offs.forEach(([dx, dy]) => {
    ctx.beginPath();
    ctx.arc(cx + dx, cy + dy, lobeR, 0, Math.PI * 2);
    ctx.fill();
  });
  // stem
  ctx.strokeStyle = color;
  ctx.lineWidth = r * 0.22;
  ctx.beginPath();
  ctx.moveTo(cx, cy + r * 0.3);
  ctx.lineTo(cx, cy + r * 0.95);
  ctx.stroke();
  ctx.lineWidth = Math.max(2, r * 0.08);
  ctx.strokeStyle = UI.charcoalViolet;
  offs.forEach(([dx, dy]) => {
    ctx.beginPath();
    ctx.arc(cx + dx, cy + dy, lobeR, 0, Math.PI * 2);
    ctx.stroke();
  });
}

function drawStar(ctx, cx, cy, r, color) {
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
  ctx.fillStyle = color;
  ctx.fill();
  outline(ctx, r);
}

function drawFlower(ctx, cx, cy, r, color) {
  const petals = 6;
  const petalR = r * 0.42;
  ctx.fillStyle = color;
  for (let i = 0; i < petals; i++) {
    const a = (Math.PI * 2 * i) / petals;
    const px = cx + Math.cos(a) * r * 0.5;
    const py = cy + Math.sin(a) * r * 0.5;
    ctx.beginPath();
    ctx.arc(px, py, petalR, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = UI.charcoalViolet;
  ctx.lineWidth = Math.max(1.5, r * 0.06);
  for (let i = 0; i < petals; i++) {
    const a = (Math.PI * 2 * i) / petals;
    const px = cx + Math.cos(a) * r * 0.5;
    const py = cy + Math.sin(a) * r * 0.5;
    ctx.beginPath();
    ctx.arc(px, py, petalR, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.4, 0, Math.PI * 2);
  ctx.fillStyle = shade(color, 30);
  ctx.fill();
  ctx.lineWidth = Math.max(2, r * 0.08);
  ctx.strokeStyle = UI.charcoalViolet;
  ctx.stroke();
}

function drawDroplet(ctx, cx, cy, r, color) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.bezierCurveTo(cx + r * 0.95, cy + r * 0.1, cx + r * 0.6, cy + r, cx, cy + r);
  ctx.bezierCurveTo(cx - r * 0.6, cy + r, cx - r * 0.95, cy + r * 0.1, cx, cy - r);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  outline(ctx, r);
}

function drawCrescent(ctx, cx, cy, r, color) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = UI.charcoalViolet;
  ctx.lineWidth = Math.max(2, r * 0.1);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + r * 0.42, cy - r * 0.12, r * 0.82, 0, Math.PI * 2);
  ctx.closePath();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fill();
  ctx.restore();
}

const SHAPE_DRAWERS = {
  spike: drawSpike,
  hex: drawHex,
  clover: drawClover,
  star: drawStar,
  flower: drawFlower,
  droplet: drawDroplet,
  crescent: drawCrescent,
};

function drawFace(ctx, cx, cy, r) {
  ctx.strokeStyle = UI.charcoalViolet;
  ctx.lineWidth = Math.max(1.5, r * 0.09);
  ctx.lineCap = 'round';
  // closed happy eyes
  [-1, 1].forEach((side) => {
    ctx.beginPath();
    ctx.arc(cx + side * r * 0.32, cy - r * 0.05, r * 0.16, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
  });
  // smile
  ctx.beginPath();
  ctx.arc(cx, cy + r * 0.15, r * 0.22, Math.PI * 0.15, Math.PI * 0.85);
  ctx.stroke();
  // blush
  ctx.fillStyle = 'rgba(255,255,255,0.0)';
  ['rgba(0,0,0,0)'].forEach(() => {});
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#ffffff';
  [-1, 1].forEach((side) => {
    ctx.beginPath();
    ctx.ellipse(cx + side * r * 0.5, cy + r * 0.22, r * 0.1, r * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

/**
 * Draw one board piece, optionally wearing a special-power overlay.
 * special: null | 'spark-row' | 'spark-col' | 'crystalball'
 */
export function drawPiece(ctx, typeId, cx, cy, r, { special = null, face = true, glowT = 0 } = {}) {
  const type = BY_ID[typeId];
  if (!type) return;
  const drawer = SHAPE_DRAWERS[type.shape] || drawHex;

  if (special) {
    ctx.save();
    const pulse = 0.5 + 0.5 * Math.sin(glowT * 6);
    ctx.shadowColor = UI.gold;
    ctx.shadowBlur = r * (0.5 + pulse * 0.5);
    drawer(ctx, cx, cy, r, type.color);
    ctx.restore();
  } else {
    drawer(ctx, cx, cy, r, type.color);
  }

  if (face) drawFace(ctx, cx, cy, r);

  if (special === 'spark-row' || special === 'spark-col') {
    ctx.save();
    ctx.strokeStyle = UI.gold;
    ctx.lineWidth = Math.max(2, r * 0.12);
    ctx.beginPath();
    if (special === 'spark-row') {
      ctx.moveTo(cx - r * 1.15, cy);
      ctx.lineTo(cx + r * 1.15, cy);
    } else {
      ctx.moveTo(cx, cy - r * 1.15);
      ctx.lineTo(cx, cy + r * 1.15);
    }
    ctx.stroke();
    ctx.restore();
  } else if (special === 'crystalball') {
    ctx.save();
    ctx.strokeStyle = UI.gold;
    ctx.lineWidth = Math.max(2, r * 0.1);
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.15, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}