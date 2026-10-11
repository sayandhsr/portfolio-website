import test from 'node:test';
import assert from 'node:assert/strict';

import { isGameBoyTrigger } from '../src/gameboy/triggerMatcher.js';
import { rotateMatrix, TETROMINOES } from '../src/gameboy/games/tetris.js';
import { findMatches, findOrphans } from '../src/gameboy/games/bubble.js';

// ==========================================
// 1. TRIGGER PHRASE MATCHER & OLD TRIGGERS
// ==========================================
test('Trigger Matcher: accepts standard Game Boy triggers', () => {
  const valid = [
    'game',
    'games',
    'game boy',
    'gameboy',
    'game-boy',
    'play games',
    'PLAY GAMES',
    'Game Boy',
    '  gameboy  ',
    '> game',
    'game!',
    'play game'
  ];

  for (const phrase of valid) {
    assert.equal(isGameBoyTrigger(phrase), true, `Expected "${phrase}" to trigger Game Boy`);
  }
});

test('Trigger Matcher: accepts close typos', () => {
  const typos = [
    'gane',
    'ganes',
    'gameboyy',
    'gam boy',
    'playgame'
  ];

  for (const phrase of typos) {
    assert.equal(isGameBoyTrigger(phrase), true, `Expected typo "${phrase}" to trigger Game Boy`);
  }
});

test('Trigger Matcher: strictly rejects individual game names and non-triggers', () => {
  const invalid = [
    'tetris',
    'snake',
    'bubble',
    'pokemon',
    'zelda',
    'mario',
    'metroid',
    'castlevania',
    'donkey kong',
    'whois',
    'skills',
    'projects',
    'hello',
    'what is snake',
    'can you play tetris',
    'tell me about pokemon'
  ];

  for (const phrase of invalid) {
    assert.equal(isGameBoyTrigger(phrase), false, `Expected "${phrase}" NOT to trigger Game Boy`);
  }
});

// ==========================================
// 2. TETRIS ROTATION & LINE CLEARS
// ==========================================
test('Tetris: Matrix 90-degree clockwise rotation', () => {
  // Test T-piece:
  // [0, 1, 0]
  // [1, 1, 1]
  // [0, 0, 0]
  const tPiece = [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0]
  ];
  const rotated = rotateMatrix(tPiece);
  // Expected rotated 90 deg clockwise:
  // [0, 1, 0]
  // [0, 1, 1]
  // [0, 1, 0]
  assert.deepEqual(rotated, [
    [0, 1, 0],
    [0, 1, 1],
    [0, 1, 0]
  ]);

  // Rotated 4 times should equal original
  let r = tPiece;
  for (let i = 0; i < 4; i++) {
    r = rotateMatrix(r);
  }
  assert.deepEqual(r, tPiece);
});

test('Tetris: Line-clear detection and grid collapse', () => {
  const boardWidth = 10;
  const boardHeight = 18;
  const grid = Array.from({ length: boardHeight }, () => new Array(boardWidth).fill(null));

  // Fill row 17 (bottom) completely
  grid[17] = new Array(boardWidth).fill(1);
  // Row 16 has 8 filled and 2 empty
  grid[16][0] = 2;
  grid[16][1] = 2;

  // Detect full lines
  const fullRows = [];
  for (let r = 0; r < boardHeight; r++) {
    if (grid[r].every(cell => cell !== null)) {
      fullRows.push(r);
    }
  }

  assert.equal(fullRows.length, 1);
  assert.equal(fullRows[0], 17);

  // Collapse row 17
  for (const r of fullRows) {
    grid.splice(r, 1);
    grid.unshift(new Array(boardWidth).fill(null));
  }

  // Now row 17 should be the previous row 16 (with cells 0, 1 filled)
  assert.equal(grid[17][0], 2);
  assert.equal(grid[17][1], 2);
  assert.equal(grid[17][2], null);
  // And top row should be empty nulls
  assert.deepEqual(grid[0], new Array(boardWidth).fill(null));
});

// ==========================================
// 3. SNAKE COLLISION & TURNING LOGIC
// ==========================================
test('Snake: Self-collision detection and boundary wrapping', () => {
  const cols = 20;
  const rows = 16;
  const snake = [
    { x: 5, y: 5 },
    { x: 4, y: 5 },
    { x: 4, y: 6 },
    { x: 5, y: 6 },
    { x: 6, y: 6 }
  ];

  // Moving left from (5,5) will hit segment (4,5)
  const dir = { x: -1, y: 0 };
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
  const selfCollides = snake.some(seg => seg.x === head.x && seg.y === head.y);
  assert.equal(selfCollides, true);

  // Moving right from (5,5) to (6,5) does not collide
  const dirSafe = { x: 1, y: 0 };
  const headSafe = { x: snake[0].x + dirSafe.x, y: snake[0].y + dirSafe.y };
  const safeCollides = snake.some(seg => seg.x === headSafe.x && seg.y === headSafe.y);
  assert.equal(safeCollides, false);

  // Wall wrap right from edge (19, 5) -> (0, 5)
  let wrapHead = { x: 19 + 1, y: 5 };
  if (wrapHead.x >= cols) wrapHead.x = 0;
  assert.equal(wrapHead.x, 0);

  // Wall wrap left from 0 -> 19
  let wrapLeftHead = { x: 0 - 1, y: 5 };
  if (wrapLeftHead.x < 0) wrapLeftHead.x = cols - 1;
  assert.equal(wrapLeftHead.x, 19);
});

// ==========================================
// 4. BUBBLE MATCH-3 & ORPHAN DETECTION
// ==========================================
test('Bubble: Match-3 finding via hexagonal flood-fill', () => {
  const grid = [
    [0, 0, 0, 1, 2, 3], // Row 0: 3 matching zeros at columns 0, 1, 2
    [1, 1, 2, 2, 3],    // Row 1 (odd row, shifted)
    [null, null, null, null, null, null]
  ];

  const matches = findMatches(grid, 0, 0);
  assert.equal(matches.length >= 3, true);

  // Isolated single bubble test
  const noMatches = findMatches(grid, 0, 3); // type 1 has only 1 connected in row 0
  assert.equal(noMatches.length, 0);
});

test('Bubble: Orphan detection disconnected from ceiling row 0', () => {
  const grid = [
    [0, 1, 2, null, null, null],       // Row 0: connected to ceiling
    [null, null, null, null, null],     // Row 1: empty gap!
    [3, 3, null, null, null, null]      // Row 2: floating bubbles with no connection to ceiling!
  ];

  const orphans = findOrphans(grid);
  assert.equal(orphans.length, 2);
  assert.equal(orphans.some(o => o.r === 2 && o.c === 0), true);
  assert.equal(orphans.some(o => o.r === 2 && o.c === 1), true);
});
