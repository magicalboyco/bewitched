import { PIECE_TYPES } from './pieces.js?v=20261104c';
import { sleep, randInt } from './util.js';

export const COLS = 8;
export const ROWS = 8;

const TYPE_IDS = PIECE_TYPES.map((p) => p.id);
const SWAP_MS = 160;
const REMOVE_MS = 220;
const FALL_MS = 260;

let nextId = 1;
const key = (r, c) => `${r},${c}`;

function makeCell(type, row, col) {
  return {
    id: nextId++,
    type,
    special: null, // null | 'spark-row' | 'spark-col' | 'crystalball'
    row,
    col,
    fromRow: row,
    fromCol: col,
    animStart: 0,
    animDuration: 0,
    popStart: 0, // pop-in bounce after spawn/refill
    removeStart: 0, // set when leaving the board (fade/shrink out)
  };
}

export class Board {
  constructor({ onScore, onParticles, onShuffle, onNoMoves, onPower } = {}) {
    this.cols = COLS;
    this.rows = ROWS;
    this.grid = [];
    this.busy = false;
    this.selected = null; // {row, col}
    this.hint = null; // {a:{row,col}, b:{row,col}, until}
    this.onScore = onScore || (() => {});
    this.onParticles = onParticles || (() => {});
    this.onShuffle = onShuffle || (() => {});
    this.onNoMoves = onNoMoves || (() => false);
    this.onPower = onPower || (() => {});
    this.reset();
  }

  reset() {
    let grid;
    do {
      grid = this._buildNoMatchGrid();
    } while (!this._hasValidMoves(grid));
    this.grid = grid;
    this.busy = false;
    this.selected = null;
    this.hint = null;
  }

  cellAt(r, c) {
    if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return null;
    return this.grid[r][c];
  }

  _buildNoMatchGrid() {
    const grid = Array.from({ length: this.rows }, () => Array(this.cols).fill(null));
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        let type;
        let tries = 0;
        do {
          type = TYPE_IDS[randInt(0, TYPE_IDS.length - 1)];
          tries++;
        } while (
          tries < 50 &&
          ((c >= 2 && grid[r][c - 1]?.type === type && grid[r][c - 2]?.type === type) ||
            (r >= 2 && grid[r - 1][c]?.type === type && grid[r - 2][c]?.type === type))
        );
        grid[r][c] = makeCell(type, r, c);
      }
    }
    return grid;
  }

  // --- matching -----------------------------------------------------

  _findMatches(grid) {
    const groups = [];
    // horizontal runs
    for (let r = 0; r < this.rows; r++) {
      let runStart = 0;
      for (let c = 1; c <= this.cols; c++) {
        const prev = grid[r][c - 1];
        const cur = c < this.cols ? grid[r][c] : null;
        if (!cur || !prev || cur.type !== prev.type) {
          const len = c - runStart;
          if (len >= 3) {
            const cells = [];
            for (let k = runStart; k < c; k++) cells.push({ row: r, col: k });
            groups.push({ cells, type: prev.type, orientation: 'row' });
          }
          runStart = c;
        }
      }
    }
    // vertical runs
    for (let c = 0; c < this.cols; c++) {
      let runStart = 0;
      for (let r = 1; r <= this.rows; r++) {
        const prev = grid[r - 1][c];
        const cur = r < this.rows ? grid[r][c] : null;
        if (!cur || !prev || cur.type !== prev.type) {
          const len = r - runStart;
          if (len >= 3) {
            const cells = [];
            for (let k = runStart; k < r; k++) cells.push({ row: k, col: c });
            groups.push({ cells, type: prev.type, orientation: 'col' });
          }
          runStart = r;
        }
      }
    }
    return groups;
  }

  _hasValidMoves(grid) {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (c + 1 < this.cols && this._swapCreatesMatch(grid, r, c, r, c + 1)) return true;
        if (r + 1 < this.rows && this._swapCreatesMatch(grid, r, c, r + 1, c)) return true;
      }
    }
    return false;
  }

  _swapCreatesMatch(grid, r1, c1, r2, c2) {
    const a = grid[r1][c1];
    const b = grid[r2][c2];
    grid[r1][c1] = { ...b, row: r1, col: c1 };
    grid[r2][c2] = { ...a, row: r2, col: c2 };
    const matched = this._findMatches(grid).length > 0;
    grid[r1][c1] = a;
    grid[r2][c2] = b;
    return matched;
  }

  // --- hints -----------------------------------------------------------

  findHint() {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (c + 1 < this.cols && this._swapCreatesMatch(this.grid, r, c, r, c + 1)) {
          return { a: { row: r, col: c }, b: { row: r, col: c + 1 } };
        }
        if (r + 1 < this.rows && this._swapCreatesMatch(this.grid, r, c, r + 1, c)) {
          return { a: { row: r, col: c }, b: { row: r + 1, col: c } };
        }
      }
    }
    return null;
  }

  showHint() {
    if (this.busy) return false;
    const found = this.findHint();
    if (!found) return false;
    this.hint = { ...found, until: performance.now() + 1900 };
    return true;
  }

  clearHint() {
    this.hint = null;
  }

  // --- public interaction --------------------------------------------

  isAdjacent(a, b) {
    const dr = Math.abs(a.row - b.row);
    const dc = Math.abs(a.col - b.col);
    return dr + dc === 1;
  }

  async trySwap(a, b) {
    if (this.busy) return false;
    if (!this.isAdjacent(a, b)) return false;
    this.hint = null;
    this.busy = true;
    const now = performance.now();
    this._swapCells(a, b, now);
    await sleep(SWAP_MS + 20);

    const matches = this._findMatches(this.grid);
    if (matches.length === 0) {
      // swap back
      this._swapCells(a, b, performance.now());
      await sleep(SWAP_MS + 20);
      this.busy = false;
      return false;
    }

    await this._resolveCascades({ swapPivot: a });
    this.busy = false;
    return true;
  }

  _swapCells(a, b, now) {
    const ca = this.grid[a.row][a.col];
    const cb = this.grid[b.row][b.col];
    ca.fromRow = ca.row;
    ca.fromCol = ca.col;
    cb.fromRow = cb.row;
    cb.fromCol = cb.col;
    ca.row = b.row;
    ca.col = b.col;
    cb.row = a.row;
    cb.col = a.col;
    ca.animStart = now;
    ca.animDuration = SWAP_MS;
    cb.animStart = now;
    cb.animDuration = SWAP_MS;
    this.grid[a.row][a.col] = cb;
    this.grid[b.row][b.col] = ca;
  }

  async _resolveCascades({ swapPivot = null } = {}) {
    let combo = 0;
    for (;;) {
      const groups = this._findMatches(this.grid);
      if (groups.length === 0) break;
      combo += 1;

      const removedSet = new Map(); // key -> {row,col}
      const spawns = []; // {row, col, special, type}
      groups.forEach((g) => {
        g.cells.forEach((c) => removedSet.set(key(c.row, c.col), c));
        if (g.cells.length >= 5) {
          const mid = g.cells[Math.floor(g.cells.length / 2)];
          spawns.push({ row: mid.row, col: mid.col, special: 'crystalball', type: g.type });
        } else if (g.cells.length === 4) {
          const mid = g.cells[Math.floor(g.cells.length / 2)];
          spawns.push({
            row: mid.row,
            col: mid.col,
            special: g.orientation === 'row' ? 'spark-row' : 'spark-col',
            type: g.type,
          });
        }
      });

      // trigger any specials caught in the blast, expanding the removal set
      const triggered = new Set();
      const queue = [...removedSet.values()];
      while (queue.length) {
        const pos = queue.pop();
        const cell = this.grid[pos.row][pos.col];
        if (!cell || !cell.special || triggered.has(cell.id)) continue;
        triggered.add(cell.id);
        if (cell.special === 'spark-row') {
          for (let c = 0; c < this.cols; c++) {
            const p = { row: cell.row, col: c };
            if (!removedSet.has(key(p.row, p.col))) {
              removedSet.set(key(p.row, p.col), p);
              queue.push(p);
            }
          }
        } else if (cell.special === 'spark-col') {
          for (let r = 0; r < this.rows; r++) {
            const p = { row: r, col: cell.col };
            if (!removedSet.has(key(p.row, p.col))) {
              removedSet.set(key(p.row, p.col), p);
              queue.push(p);
            }
          }
        } else if (cell.special === 'crystalball') {
          for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
              const t = this.grid[r][c];
              if (t && t.type === cell.type) {
                const p = { row: r, col: c };
                if (!removedSet.has(key(p.row, p.col))) {
                  removedSet.set(key(p.row, p.col), p);
                  queue.push(p);
                }
              }
            }
          }
        }
      }

      // spawn pivots survive as upgraded pieces instead of being cleared
      const spawnKeys = new Set();
      spawns.forEach((s) => {
        const k = key(s.row, s.col);
        if (removedSet.has(k)) {
          spawnKeys.add(k);
        }
      });

      const now = performance.now();
      const particlePts = [];
      removedSet.forEach((pos, k) => {
        const cell = this.grid[pos.row][pos.col];
        if (!cell) return;
        particlePts.push({ row: pos.row, col: pos.col, type: cell.type });
        if (spawnKeys.has(k)) return; // becomes a special piece, not removed
        cell.removeStart = now;
      });

      // upgrade pivot cells to their special form
      spawns.forEach((s) => {
        const cell = this.grid[s.row][s.col];
        if (cell && removedSet.has(key(s.row, s.col))) {
          cell.special = s.special;
          cell.popStart = now;
        }
      });

      const scoreGain = (removedSet.size - spawnKeys.size) * 10 * combo;
      if (scoreGain > 0) this.onScore(scoreGain, combo);
      this.onParticles(particlePts);
      if (spawns.length > 0) this.onPower();

      await sleep(REMOVE_MS);

      // null out removed cells, then collapse + refill
      removedSet.forEach((pos, k) => {
        if (spawnKeys.has(k)) return;
        this.grid[pos.row][pos.col] = null;
      });

      this._collapseAndRefill(performance.now());
      await sleep(FALL_MS);
    }

    if (!this._hasValidMoves(this.grid)) {
      if (this.onNoMoves()) return;
      await this._shuffle();
    }
  }

  _collapseAndRefill(now) {
    for (let c = 0; c < this.cols; c++) {
      const stack = [];
      for (let r = this.rows - 1; r >= 0; r--) {
        if (this.grid[r][c]) stack.push(this.grid[r][c]);
      }
      let writeRow = this.rows - 1;
      for (const cell of stack) {
        this.grid[writeRow][c] = cell;
        if (cell.row !== writeRow) {
          cell.fromRow = cell.row;
          cell.fromCol = c;
          cell.animStart = now;
          cell.animDuration = FALL_MS;
        }
        cell.row = writeRow;
        cell.col = c;
        writeRow--;
      }
      // fill remaining empties from above with fresh pieces
      let spawnOffset = 1;
      for (let r = writeRow; r >= 0; r--) {
        const type = TYPE_IDS[randInt(0, TYPE_IDS.length - 1)];
        const cell = makeCell(type, r, c);
        cell.fromRow = r - (writeRow + spawnOffset);
        cell.fromCol = c;
        cell.animStart = now;
        cell.animDuration = FALL_MS;
        cell.popStart = now;
        this.grid[r][c] = cell;
        spawnOffset++;
      }
    }
  }

  async _shuffle() {
    this.onShuffle();
    const now = performance.now();
    let grid;
    do {
      grid = this._buildNoMatchGrid();
    } while (!this._hasValidMoves(grid));
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        grid[r][c].popStart = now;
      }
    }
    this.grid = grid;
    await sleep(240);
  }
}