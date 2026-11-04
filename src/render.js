import { drawPiece, typeById } from './pieces.js';
import { UI } from './palette.js';
import { clamp, easeOutCubic, easeOutBack, lerp, randInt } from './util.js';
import { settings } from './settings.js';

const SWAP_SHRINK = 220;
const POPUP_LIFE = 900;
const CALLOUT_LIFE = 1100;
const FLASH_LIFE = 260;

const COMBO_CALLOUTS = {
  3: 'Nice!',
  4: 'Great!',
  5: 'Spellbinding!',
};
const COMBO_CALLOUT_MAX = 'Cursed Combo!';

export class BoardRenderer {
  constructor(canvas, board) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.board = board;
    this.particles = [];
    this.popups = [];
    this.callout = null; // {text, born}
    this.flash = null; // {born, color}
    this.cellSize = canvas.width / board.cols;
    this.stars = Array.from({ length: 28 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: 0.6 + Math.random() * 1.3,
      phase: Math.random() * Math.PI * 2,
      speed: 0.6 + Math.random() * 0.8,
    }));
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
      const count = settings.reducedMotion ? randInt(2, 3) : randInt(5, 8);
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

  /** Called from game.js on every Board#onCombo event. */
  handleCombo({ scoreGain, combo, points, hadPower }) {
    if (!points.length) return;
    const cx = points.reduce((s, p) => s + p.col, 0) / points.length;
    const cy = points.reduce((s, p) => s + p.row, 0) / points.length;
    const x = cx * this.cellSize + this.cellSize / 2;
    const y = cy * this.cellSize + this.cellSize / 2;
    this._addPopup(x, y, `+${scoreGain}`);

    const calloutText = combo >= 6 ? COMBO_CALLOUT_MAX : COMBO_CALLOUTS[combo];
    if (calloutText) this._setCallout(calloutText);

    if (hadPower && !settings.reducedMotion) {
      this.flash = { born: performance.now(), color: 'rgba(255,226,150,0.35)' };
    }
  }

  _addPopup(x, y, text) {
    this.popups.push({ x, y, text, born: performance.now() });
  }

  _setCallout(text) {
    this.callout = { text, born: performance.now() };
  }

  _updateParticles(now, dt) {
    this.particles = this.particles.filter((p) => now - p.born < p.life);
    this.particles.forEach((p) => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 90 * dt;
    });
  }

  _drawBackground(now) {
    const { ctx, canvas, cellSize, board } = this;
    const w = canvas.width;
    const h = canvas.height;

    const bg = ctx.createRadialGradient(w / 2, h * 0.38, w * 0.12, w / 2, h / 2, w * 0.75);
    bg.addColorStop(0, '#3a2250');
    bg.addColorStop(0.55, '#241638');
    bg.addColorStop(1, '#150d22');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // twinkling dust
    this.stars.forEach((s) => {
      const tw = settings.reducedMotion
        ? 0.6
        : 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(now / 1000 * s.speed + s.phase));
      ctx.save();
      ctx.globalAlpha = tw * 0.8;
      ctx.fillStyle = UI.lilac;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // faint rune circle behind the board
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = UI.gold;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w * 0.42, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w * 0.3, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI / 4) * i;
      ctx.beginPath();
      ctx.moveTo(w / 2 + Math.cos(a) * w * 0.3, h / 2 + Math.sin(a) * h * 0.3);
      ctx.lineTo(w / 2 + Math.cos(a) * w * 0.42, h / 2 + Math.sin(a) * h * 0.42);
      ctx.stroke();
    }
    ctx.restore();

    // cell checker + hairlines
    for (let r = 0; r < board.rows; r++) {
      for (let c = 0; c < board.cols; c++) {
        const checker = (r + c) % 2 === 0;
        ctx.fillStyle = checker ? 'rgba(200,162,77,0.05)' : 'rgba(0,0,0,0.08)';
        ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
      }
    }
    ctx.save();
    ctx.strokeStyle = 'rgba(200,162,77,0.08)';
    ctx.lineWidth = 1;
    for (let i = 1; i < board.cols; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, h);
      ctx.stroke();
    }
    for (let i = 1; i < board.rows; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(w, i * cellSize);
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawSelection(now) {
    const sel = this.board.selected;
    if (!sel) return;
    const { ctx, cellSize } = this;
    const cx = sel.col * cellSize + cellSize / 2;
    const cy = sel.row * cellSize + cellSize / 2;
    const pulse = settings.reducedMotion ? 0.5 : 0.5 + 0.5 * Math.sin(now / 160);
    ctx.save();
    ctx.strokeStyle = UI.gold;
    ctx.lineWidth = 3;
    ctx.shadowColor = UI.gold;
    ctx.shadowBlur = settings.reducedMotion ? 4 : 10;
    ctx.globalAlpha = 0.6 + pulse * 0.4;
    ctx.beginPath();
    ctx.roundRect(cx - cellSize / 2 + 4, cy - cellSize / 2 + 4, cellSize - 8, cellSize - 8, 10);
    ctx.stroke();
    ctx.restore();
  }

  _drawHint(now) {
    const hint = this.board.hint;
    if (!hint) return;
    if (now > hint.until) {
      this.board.clearHint();
      return;
    }
    const { ctx, cellSize } = this;
    const remain = hint.until - now;
    const fadeOut = remain < 300 ? remain / 300 : 1;
    const pulse = settings.reducedMotion ? 0.6 : 0.5 + 0.5 * Math.sin(now / 130);

    [hint.a, hint.b].forEach((cell) => {
      const cx = cell.col * cellSize + cellSize / 2;
      const cy = cell.row * cellSize + cellSize / 2;
      ctx.save();
      ctx.globalAlpha = (0.55 + pulse * 0.45) * fadeOut;
      ctx.strokeStyle = UI.gold;
      ctx.lineWidth = 4;
      ctx.shadowColor = UI.gold;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.roundRect(cx - cellSize / 2 + 3, cy - cellSize / 2 + 3, cellSize - 6, cellSize - 6, 12);
      ctx.stroke();
      ctx.restore();
    });
  }

  _drawPopups(now) {
    const { ctx } = this;
    this.popups = this.popups.filter((p) => now - p.born < POPUP_LIFE);
    this.popups.forEach((p) => {
      const t = (now - p.born) / POPUP_LIFE;
      const rise = settings.reducedMotion ? 10 : 34;
      ctx.save();
      ctx.globalAlpha = clamp(1 - t * 1.1, 0, 1);
      ctx.fillStyle = UI.gold;
      ctx.font = `700 ${Math.round(this.cellSize * 0.26)}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 4;
      ctx.fillText(p.text, p.x, p.y - rise * easeOutCubic(t));
      ctx.restore();
    });
  }

  _drawCallout(now) {
    if (!this.callout) return;
    const t = (now - this.callout.born) / CALLOUT_LIFE;
    if (t >= 1) {
      this.callout = null;
      return;
    }
    const { ctx, canvas } = this;
    const pop = t < 0.2 ? easeOutBack(t / 0.2) : 1;
    const alpha = t > 0.7 ? clamp(1 - (t - 0.7) / 0.3, 0, 1) : 1;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(canvas.width / 2, canvas.height * 0.28);
    ctx.scale(pop, pop);
    ctx.font = `800 ${Math.round(canvas.width * 0.07)}px Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = UI.gold;
    ctx.strokeStyle = UI.charcoalViolet;
    ctx.lineWidth = 4;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 10;
    ctx.strokeText(this.callout.text, 0, 0);
    ctx.fillText(this.callout.text, 0, 0);
    ctx.restore();
  }

  _drawFlash(now) {
    if (!this.flash) return;
    const t = (now - this.flash.born) / FLASH_LIFE;
    if (t >= 1) {
      this.flash = null;
      return;
    }
    const { ctx, canvas } = this;
    ctx.save();
    ctx.globalAlpha = clamp(1 - t, 0, 1) * 0.8;
    ctx.fillStyle = this.flash.color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
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

    this._drawBackground(now);

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

    this._drawHint(now);
    this._drawSelection(now);
    this._drawParticles();
    this._drawPopups(now);
    this._drawCallout(now);
    this._drawFlash(now);
  }
}
