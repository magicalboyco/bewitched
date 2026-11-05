import test from 'node:test';
import assert from 'node:assert/strict';
import { Board } from '../src/board.js';

const colors = ['amethyst','moonstone','herb','star','marigold','potion','crescent'];
let nextId = 1;
const at = (row, col) => ({ row, col });

function board() {
  const b = new Board();
  // An 8×8 grid with no accidental horizontal/vertical matches.
  b.grid = Array.from({ length: 8 }, (_, row) =>
    Array.from({ length: 8 }, (_, col) => ({
      id: nextId++, row, col, fromRow: row, fromCol: col,
      type: colors[(row * 2 + col * 3) % 7], special: null,
    })));
  return b;
}

function set(b, row, col, type, special = null) {
  Object.assign(b.grid[row][col], { type, special });
}

function captureRemoval(b) {
  let last = null;
  b._processRemoval = async (positions, spawns, combo, extra) => {
    last = { positions: [...positions.keys()], spawns, combo, extra };
    b.grid = board().grid;
  };
  b._hasValidMoves = () => true;
  return () => last;
}

for (const special of ['spark-row', 'spark-col', 'witchfire', 'comet']) {
  test(`wrong-color swap of ${special} is rejected without detonation`, async () => {
    const b = board();
    set(b, 3, 3, 'amethyst', special);
    set(b, 3, 4, 'moonstone');
    const before = b.grid.map(row => row.map(c => [c.type, c.special]));
    assert.equal(b._swapIsPlayable(b.grid, 3, 3, 3, 4), false);
    assert.equal(await b.trySwap(at(3, 3), at(3, 4)), false);
    assert.deepEqual(b.grid.map(row => row.map(c => [c.type, c.special])), before);
  });
}

test('two colored specials do not bypass same-color matching', async () => {
  const b = board();
  set(b, 3, 3, 'amethyst', 'spark-row');
  set(b, 3, 4, 'moonstone', 'witchfire');
  assert.equal(b._swapIsPlayable(b.grid, 3, 3, 3, 4), false);
  assert.equal(await b.trySwap(at(3, 3), at(3, 4)), false);
});

test('three-of-a-kind containing Spark triggers its row and column', async () => {
  const b = board();
  set(b, 3, 1, 'amethyst');
  set(b, 3, 2, 'amethyst');
  set(b, 3, 3, 'moonstone');
  set(b, 4, 3, 'amethyst', 'spark-row');
  const get = captureRemoval(b);
  assert.equal(await b.trySwap(at(3, 3), at(4, 3)), true);
  assert(get().positions.includes('3,7'));
  assert(get().positions.includes('0,3'));
});

test('Crystal Ball is colorless for regular 3-matches', () => {
  const b = board();
  set(b, 3, 2, 'amethyst');
  set(b, 3, 3, 'amethyst', 'crystalball');
  set(b, 3, 4, 'amethyst');
  assert.equal(b._findMatches(b.grid).some(group =>
    group.cells.some(cell => cell.row === 3 && cell.col === 3)), false);
});

for (const [special, expected] of [
  ['spark-row', 15], ['spark-col', 15],
  ['witchfire', 9], ['comet', 39],
]) {
  test(`${special} clears ${expected} cells at the center`, () => {
    const b = board();
    set(b, 3, 3, 'amethyst', special);
    const removed = new Map([['3,3', at(3, 3)]]);
    b._expandSpecials(removed, [at(3, 3)]);
    assert.equal(removed.size, expected);
  });
}

test('a special caught by another blast chains into its own effect', () => {
  const b = board();
  set(b, 3, 3, 'amethyst', 'spark-row');
  set(b, 3, 5, 'moonstone', 'witchfire');
  const removed = new Map([['3,3', at(3, 3)]]);
  b._expandSpecials(removed, [at(3, 3)]);
  assert(removed.has('2,6'));
});

test('Crystal Ball swapped with a regular gem selects adjacent color', async () => {
  const b = board();
  set(b, 3, 3, 'amethyst', 'crystalball');
  set(b, 3, 4, 'moonstone');
  const get = captureRemoval(b);
  assert.equal(await b.trySwap(at(3, 3), at(3, 4)), true);
  assert(get().positions.includes('3,3'));
  assert(get().positions.includes('3,4'));
  assert(get().positions.includes('0,5')); // Another moonstone.
  assert(!get().positions.includes('0,0')); // Unrelated amethyst.
});

test('Crystal Ball + Crystal Ball clears the board', async () => {
  const b = board();
  set(b, 3, 3, 'amethyst', 'crystalball');
  set(b, 3, 4, 'moonstone', 'crystalball');
  const get = captureRemoval(b);
  assert.equal(await b.trySwap(at(3, 3), at(3, 4)), true);
  assert.equal(get().positions.length, 64);
});

for (const [length, expected] of [[4,'witchfire'], [5,'crystalball'], [6,'comet']]) {
  test(`${length} identical gems creates ${expected}`, async () => {
    const b = board();
    for (let col = 0; col < length; col++) set(b, 3, col, 'amethyst');
    if (length < 8) set(b, 3, length, 'moonstone');
    const get = captureRemoval(b);
    await b._resolveCascades();
    assert(get().spawns.some(spawn => spawn.special === expected));
  });
}

test('crossing T/L/+ match creates Spark Charm', async () => {
  const b = board();
  for (const [row, col] of [[3,2], [3,3], [3,4], [2,3], [4,3]])
    set(b, row, col, 'amethyst');
  for (const [row, col] of [[3,1], [3,5], [1,3], [5,3]])
    set(b, row, col, 'moonstone');
  const get = captureRemoval(b);
  await b._resolveCascades();
  assert(get().spawns.some(spawn => spawn.special === 'spark-row'));
});
