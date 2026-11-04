import { drawPiece, typeById } from './pieces.js';
import { UI } from './palette.js';
import { clamp, easeOutCubic, easeOutBack, lerp, randInt } from './util.js';

const SWAP_SHRINK = 220;

export class BoardRenderer {
  constructor(canvas, board) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.board = board;
    this.particles = [];
    this.cellSize = canvas.width / board.cols;
  }

  resize() {
    this.cellSize = this.canvas.width / this.board.cols;
  }

  addParticles(points) {
    const now = performance.now();
    points.forEach(({ row, col, type }) => {
      const cx = col * this.cellSize + this.cellSize / 2;
      const cy = row * this.cellSize + this.cellSize / 2;
      const color = typeById(type)?.color || UI.gold;
      const count = randInt(5, 8);
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const speed = 60 + Math.random() * 90;
        this.particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(a) * speed,
          vy: Math.sin(a) * speed,
          born: now,
          life: 420 + Math.random() * 220,
          color,
          size: 3 + Math.random() * 3,
        });
      }
    });
  }

  _updateParticles(now, dt) {
    this.particles = this.particles.filter((p) => now - p.born < p.life);
    this.particles.forEach((p) => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 90 * dt;
    });
  }

  _drawBackground() {
    const { ctx, canvas, cellSize, board } = this;
    ctx.fillStyle = UI.cream;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // faint parchment ruling
    ctx.strokeStyle = 'rgba(109,61,142,0.08)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 6; i++) {
      const y = (canvas.height / 6) * i;
      ctx.beginPath();
      ctx.moveTo(10, y);
      ctx.lineTo(canvas.width - 10, y);
      ctx.stroke();
    }

    for (let r = 0; r < board.rows; r++) {
      for (let c = 0; c < board.cols; c++) {
        const checker = (r + c) % 2 === 0;
        ctx.fillStyle = checker ? 'rgba(109,61,142,0.06)' : 'rgba(109,61,142,0.0)';
        ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
      }
    }
  }

  _drawSelection(now) {
    const sel = this.board.selected;
    if (!sel) return;
    const { ctx, cellSize } = this;
    const cx = sel.col * cellSize + cellSize / 2;
    const cy = sel.row * cellSize + cellSize / 2;
    const pulse = 0.5 + 0.5 * Math.sin(now / 160);
    ctx.save();
    ctx.strokeStyle = UI.gold;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.6 + pulse * 0.4;
    ctx.beginPath();
    ctx.roundRect(cx - cellSize / 2 + 4, cy - cellSize / 2 + 4, cellSize - 8, cellSize - 8, 10);
    ctx.stroke();
    ctx.restore();
  }

  _drawParticles() {
    const { ctx } = this;
    const now = performance.now();
    this.particles.forEach((p) => {
      const t = (now - p.born) / p.life;
      ctx.save();
      ctx.globalAlpha = clamp(1 - t, 0, 1);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  draw() {
    const now = performance.now();
    const dt = 1 / 60;
    this._updateParticles(now, dt);

    this._drawBackground();

    const { ctx, cellSize, board } = this;
    for (let r = 0; r < board.rows; r++) {
      for (let c = 0; c < board.cols; c++) {
        const cell = board.grid[r][c];
        if (!cell) continue;

        let visRow = cell.row;
        let visCol = cell.col;
        if (cell.animDuration > 0) {
          const t = clamp((now - cell.animStart) / cell.animDuration, 0, 1);
          const e = easeOutCubic(t);
          visRow = lerp(cell.fromRow, cell.row, e);
          visCol = lerp(cell.fromCol, cell.col, e);
        }

        let scale = 1;
        let alpha = 1;
        if (cell.removeStart) {
          const t = clamp((now - cell.removeStart) / SWAP_SHRINK, 0, 1);
          scale = 1 - t;
          alpha = 1 - t;
        } else if (cell.popStart) {
          const t = clamp((now - cell.popStart) / 260, 0, 1);
          scale = t < 1 ? 0.3 + 0.7 * easeOutBack(t) : 1;
        }

        const cx = visCol * cellSize + cellSize / 2;
        const cy = visRow * cellSize + cellSize / 2;
        const radius = (cellSize / 2) * 0.78 * scale;
        if (radius <= 0.5) continue;

        ctx.save();
        ctx.globalAlpha = alpha;
        drawPiece(ctx, cell.type, cx, cy, radius, {
          special: cell.special,
          glowT: now / 1000,
        });
        ctx.restore();
      }
    }

    this._drawSelection(now);
    this._drawParticles();
  }
}