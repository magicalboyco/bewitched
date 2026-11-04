import { PIECE_TYPES } from './pieces.js';
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
    special: null, // null | 'spark-row' | 'spark-col' | 'crystalball' | 'comet' | 'witchfire'
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
  constructor({ onScore, onParticles, onShuffle, onNoMoves, onPower, onCombo } = {}) {
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
    // Fired once per cascade step with everything a UI needs to place a
    // floating score popup / combo callout: the score gained, the combo
    // tier, the board cells that were cleared this step, and — for a
    // deliberate special+special swap — which kind of combo it was.
    this.onCombo = onCombo || (() => {});
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
        if (c + 1 < this.cols && this._swapIsPlayable(grid, r, c, r, c + 1)) return true;
        if (r + 1 < this.rows && this._swapIsPlayable(grid, r, c, r + 1, c)) return true;
      }
    }
    return false;
  }

  // A swap is playable if it forms a match OR activates a special piece —
  // trySwap() honors both, so the "any moves left?" checks must agree,
  // otherwise the board could reshuffle out from under a free special.
  _swapIsPlayable(grid, r1, c1, r2, c2) {
    const a = grid[r1][c1];
    const b = grid[r2][c2];
    if (a.special || b.special) return true;
    return this._swapCreatesMatch(grid, r1, c1, r2, c2);
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
        if (c + 1 < this.cols && this._swapIsPlayable(this.grid, r, c, r, c + 1)) {
          return { a: { row: r, col: c }, b: { row: r, col: c + 1 } };
        }
        if (r + 1 < this.rows && this._swapIsPlayable(this.grid, r, c, r + 1, c)) {
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
      // A swap that doesn't form a 3-match still activates if a special
      // piece is involved — that's the only way to ever combine two
      // specials (swapping them into each other never makes a run-of-3).
      const cellAtA = this.grid[a.row][a.col];
      const cellAtB = this.grid[b.row][b.col];
      if (cellAtA.special || cellAtB.special) {
        await this._resolveComboSwap(cellAtA, cellAtB);
        this.busy = false;
        return true;
      }
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

  /**
   * Expands removedSet/queue to include everything each special piece in
   * the queue clears (a row, a column, or every piece of its remembered
   * color) — and recurses when that expansion catches further specials,
   * so a spark that sweeps through a crystal ball chains into it too.
   */
  _expandSpecials(removedSet, queue) {
    const triggered = new Set();
    while (queue.length) {
      const pos = queue.pop();
      const cell = this.grid[pos.row][pos.col];
      if (!cell || !cell.special || triggered.has(cell.id)) continue;
      triggered.add(cell.id);
      if (cell.special === 'spark-row' || cell.special === 'comet') {
        this._addRow(removedSet, queue, cell.row);
      }
      if (cell.special === 'spark-col' || cell.special === 'comet') {
        this._addCol(removedSet, queue, cell.col);
      }
      if (cell.special === 'crystalball' || cell.special === 'comet') {
        this._addColor(removedSet, queue, cell.type);
      }
      if (cell.special === 'witchfire') {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const r = cell.row + dr;
            const c = cell.col + dc;
            if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) continue;
            this._addCell(removedSet, queue, r, c);
          }
        }
      }
    }
  }

  _addCell(removedSet, queue, r, c) {
    if (removedSet.has(key(r, c))) return;
    const p = { row: r, col: c };
    removedSet.set(key(r, c), p);
    queue.push(p);
  }

  _addRow(removedSet, queue, row) {
    for (let c = 0; c < this.cols; c++) this._addCell(removedSet, queue, row, c);
  }

  _addCol(removedSet, queue, col) {
    for (let r = 0; r < this.rows; r++) this._addCell(removedSet, queue, r, col);
  }

  _addColor(removedSet, queue, type) {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c]?.type === type) this._addCell(removedSet, queue, r, c);
      }
    }
  }

  /**
   * Shared tail end of a cleared batch of cells: score, particles,
   * onCombo, the remove/collapse/refill animation beats. Spawns (newly
   * minted special pieces) survive at their pivot cell instead of being
   * cleared; comboSwap batches never have spawns.
   */
  async _processRemoval(removedSet, spawns, combo, extra = {}) {
    const spawnKeys = new Set();
    spawns.forEach((s) => {
      const k = key(s.row, s.col);
      if (removedSet.has(k)) spawnKeys.add(k);
    });

    const now = performance.now();
    const particlePts = [];
    removedSet.forEach((pos, k) => {
      const cell = this.grid[pos.row][pos.col];
      if (!cell) return;
      particlePts.push({ row: pos.row, col: pos.col, type: cell.type });
      if (spawnKeys.has(k)) return;
      cell.removeStart = now;
    });

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
    if (scoreGain > 0) {
      this.onCombo({
        scoreGain,
        combo,
        cellCount: removedSet.size,
        points: particlePts,
        hadPower: spawns.length > 0,
        spawnKinds: spawns.map((s) => s.special),
        comboKind: extra.comboKind || null,
      });
    }

    await sleep(REMOVE_MS);

    removedSet.forEach((pos, k) => {
      if (spawnKeys.has(k)) return;
      this.grid[pos.row][pos.col] = null;
    });

    this._collapseAndRefill(performance.now());
    await sleep(FALL_MS);
  }

  /**
   * Swapping two special pieces into each other — or a special into a
   * plain piece with no resulting match — detonates rather than reverts.
   * Two specials together chain through _expandSpecials simultaneously:
   * two Sparks clear their rows/columns together (a cross when one is a
   * row and the other a column), a Spark + Crystal Ball clears a whole
   * color AND sweeps a row/column, two Crystal Balls clear two colors.
   */
  async _resolveComboSwap(cellA, cellB) {
    const kinds = [cellA.special, cellB.special].filter(Boolean);
    let comboKind = 'solo-activation';
    if (kinds.length === 2) {
      const ballCount = kinds.filter((k) => k === 'crystalball').length;
      comboKind = ballCount === 2 ? 'crystalball-crystalball' : ballCount === 1 ? 'spark-crystalball' : 'spark-spark';
    }

    const removedSet = new Map();
    const queue = [];
    [cellA, cellB].forEach((cell) => {
      if (cell.special) {
        const pos = { row: cell.row, col: cell.col };
        removedSet.set(key(pos.row, pos.col), pos);
        queue.push(pos);
      }
    });
    this._expandSpecials(removedSet, queue);

    const combo = kinds.length === 2 ? 2 : 1;
    await this._processRemoval(removedSet, [], combo, { comboKind });

    // Falling pieces from a big combo clear can themselves form new
    // matches — resolve those the normal way, including the end-of-turn
    // no-valid-moves check.
    await this._resolveCascades({});
  }

  async _resolveCascades({ swapPivot = null } = {}) {
    let combo = 0;
    for (;;) {
      const groups = this._findMatches(this.grid);
      if (groups.length === 0) break;
      combo += 1;

      const removedSet = new Map(); // key -> {row,col}
      const spawns = []; // {row, col, special, type}
      groups.forEach((g) => g.cells.forEach((c) => removedSet.set(key(c.row, c.col), c)));

      // An L/T shape — a row-run and a column-run of exactly 3 sharing a
      // corner cell — is worth more than either run alone, so it becomes
      // one Witchfire charm instead of two plain 3-clears. Only the plain
      // 3+3 case is handled; a run of 4+ crossing another run still just
      // resolves as its own independent spawn below (keeps the shape
      // detection simple and unambiguous).
      const consumed = new Set();
      for (let i = 0; i < groups.length; i++) {
        if (consumed.has(i) || groups[i].orientation !== 'row' || groups[i].cells.length !== 3) continue;
        for (let j = 0; j < groups.length; j++) {
          if (consumed.has(j) || groups[j].orientation !== 'col' || groups[j].cells.length !== 3) continue;
          const corner = groups[i].cells.find((a) => groups[j].cells.some((b) => a.row === b.row && a.col === b.col));
          if (!corner) continue;
          spawns.push({ row: corner.row, col: corner.col, special: 'witchfire', type: groups[i].type });
          consumed.add(i);
          consumed.add(j);
          break;
        }
      }

      groups.forEach((g, idx) => {
        if (consumed.has(idx)) return;
        const mid = g.cells[Math.floor(g.cells.length / 2)];
        if (g.cells.length >= 6) {
          spawns.push({ row: mid.row, col: mid.col, special: 'comet', type: g.type });
        } else if (g.cells.length >= 5) {
          spawns.push({ row: mid.row, col: mid.col, special: 'crystalball', type: g.type });
        } else if (g.cells.length === 4) {
          spawns.push({
            row: mid.row,
            col: mid.col,
            special: g.orientation === 'row' ? 'spark-row' : 'spark-col',
            type: g.type,
          });
        }
      });

      // trigger any specials caught in the blast, expanding the removal set
      const queue = [...removedSet.values()];
      this._expandSpecials(removedSet, queue);

      await this._processRemoval(removedSet, spawns, combo);
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
