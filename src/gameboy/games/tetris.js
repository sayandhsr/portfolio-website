// Tetris Game (Original implementation for 160x144 Game Boy Canvas)
import { BUTTONS } from '../InputManager.js';

export const TETROMINOES = {
  I: { shape: [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]], shade: 0 },
  J: { shape: [[1,0,0], [1,1,1], [0,0,0]], shade: 1 },
  L: { shape: [[0,0,1], [1,1,1], [0,0,0]], shade: 1 },
  O: { shape: [[1,1], [1,1]], shade: 2 },
  S: { shape: [[0,1,1], [1,1,0], [0,0,0]], shade: 1 },
  T: { shape: [[0,1,0], [1,1,1], [0,0,0]], shade: 0 },
  Z: { shape: [[1,1,0], [0,1,1], [0,0,0]], shade: 1 }
};

export const rotateMatrix = (matrix) => {
  const N = matrix.length;
  const result = matrix.map((row, i) =>
    row.map((val, j) => matrix[N - 1 - j][i])
  );
  return result;
};

export default class TetrisGame {
  constructor() {
    this.ctx = null;
    this.boardWidth = 10;
    this.boardHeight = 18;
    this.cellSize = 7;
    this.boardX = 10;
    this.boardY = 9;

    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.highScore = 0;

    this.grid = [];
    this.bag = [];
    this.currentPiece = null;
    this.pieceX = 0;
    this.pieceY = 0;

    this.nextPiece = null;
    this.holdPiece = null;
    this.canHold = true;

    this.dropTimer = 0;
    this.dropInterval = 0.8;
    this.gameOver = false;
    this.paused = false;
    this.inTitle = true;

    this.clearingLines = [];
    this.clearFlashTimer = 0;
  }

  init(ctx) {
    this.ctx = ctx;
    this.highScore = ctx.storage.getHighScore('tetris');
    this.inTitle = true;
    this.reset(true);
  }

  reset(keepTitle = false) {
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.dropInterval = 0.8;
    this.gameOver = false;
    if (!keepTitle) {
      this.inTitle = false;
    }
    this.grid = Array.from({ length: this.boardHeight }, () => new Array(this.boardWidth).fill(null));
    this.bag = [];
    this.holdPiece = null;
    this.canHold = true;
    this.clearingLines = [];
    this.nextPiece = this.drawFromBag();
    this.spawnPiece();
  }

  drawFromBag() {
    if (this.bag.length === 0) {
      const keys = Object.keys(TETROMINOES);
      for (let i = keys.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [keys[i], keys[j]] = [keys[j], keys[i]];
      }
      this.bag = keys;
    }
    const key = this.bag.pop();
    return {
      type: key,
      shape: TETROMINOES[key].shape.map(r => [...r]),
      shade: TETROMINOES[key].shade
    };
  }

  spawnPiece() {
    this.currentPiece = this.nextPiece;
    this.nextPiece = this.drawFromBag();
    this.pieceX = Math.floor((this.boardWidth - this.currentPiece.shape[0].length) / 2);
    this.pieceY = 0;
    this.canHold = true;

    if (this.collides(this.currentPiece.shape, this.pieceX, this.pieceY)) {
      this.gameOver = true;
      this.ctx.audio.playGameOver();
      if (this.ctx.storage.setHighScore('tetris', this.score)) {
        this.highScore = this.score;
      }
    }
  }

  collides(shape, px, py) {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          const x = px + c;
          const y = py + r;
          if (x < 0 || x >= this.boardWidth || y >= this.boardHeight) {
            return true;
          }
          if (y >= 0 && this.grid[y][x] !== null) {
            return true;
          }
        }
      }
    }
    return false;
  }

  rotate() {
    const rotated = rotateMatrix(this.currentPiece.shape);
    // Wall kick offsets: try normal, then left, then right
    const kicks = [0, -1, 1, -2, 2];
    for (const kick of kicks) {
      if (!this.collides(rotated, this.pieceX + kick, this.pieceY)) {
        this.currentPiece.shape = rotated;
        this.pieceX += kick;
        this.ctx.audio.playCursor();
        return;
      }
    }
  }

  lockPiece() {
    const { shape, shade } = this.currentPiece;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          const y = this.pieceY + r;
          const x = this.pieceX + c;
          if (y >= 0 && y < this.boardHeight && x >= 0 && x < this.boardWidth) {
            this.grid[y][x] = shade;
          }
        }
      }
    }

    this.checkLines();
    this.ctx.audio.playHit();
  }

  checkLines() {
    const fullRows = [];
    for (let r = 0; r < this.boardHeight; r++) {
      if (this.grid[r].every(cell => cell !== null)) {
        fullRows.push(r);
      }
    }

    if (fullRows.length > 0) {
      this.clearingLines = fullRows;
      this.clearFlashTimer = 0.2;
      this.ctx.audio.playCoin();
      this.ctx.renderer.flash(3, 3);

      const points = [0, 100, 300, 500, 800];
      this.score += (points[fullRows.length] || 1000) * this.level;
      this.lines += fullRows.length;
      this.level = Math.floor(this.lines / 10) + 1;
      this.dropInterval = Math.max(0.1, 0.8 - (this.level - 1) * 0.07);

      if (this.ctx.onScoreUpdate) this.ctx.onScoreUpdate(this.score);
    } else {
      this.spawnPiece();
    }
  }

  hold() {
    if (!this.canHold) return;
    this.ctx.audio.playSelect();
    const currentType = this.currentPiece.type;
    if (this.holdPiece) {
      const temp = this.holdPiece;
      this.holdPiece = currentType;
      this.currentPiece = {
        type: temp,
        shape: TETROMINOES[temp].shape.map(r => [...r]),
        shade: TETROMINOES[temp].shade
      };
      this.pieceX = Math.floor((this.boardWidth - this.currentPiece.shape[0].length) / 2);
      this.pieceY = 0;
    } else {
      this.holdPiece = currentType;
      this.spawnPiece();
    }
    this.canHold = false;
  }

  pause() { this.paused = true; }
  resume() { this.paused = false; }
  destroy() {}
  getScore() { return this.score; }

  update(dt, input) {
    if (this.inTitle) {
      if (input.justPressed(BUTTONS.A) || input.justPressed(BUTTONS.START)) {
        this.ctx.audio.playSelect();
        this.reset();
      }
      return;
    }

    if (this.gameOver) {
      if (input.justPressed(BUTTONS.A) || input.justPressed(BUTTONS.START)) {
        this.ctx.audio.playSelect();
        this.reset();
      }
      return;
    }

    if (input.justPressed(BUTTONS.START) || input.justPressed(BUTTONS.ESC)) {
      this.paused = !this.paused;
      this.ctx.audio.playCursor();
      return;
    }

    if (this.paused) return;

    // Line clear animation pause
    if (this.clearFlashTimer > 0) {
      this.clearFlashTimer -= dt;
      if (this.clearFlashTimer <= 0) {
        // Clear lines
        for (const row of this.clearingLines) {
          this.grid.splice(row, 1);
          this.grid.unshift(new Array(this.boardWidth).fill(null));
        }
        this.clearingLines = [];
        this.spawnPiece();
      }
      return;
    }

    // Input controls
    if (input.justPressed(BUTTONS.LEFT)) {
      if (!this.collides(this.currentPiece.shape, this.pieceX - 1, this.pieceY)) {
        this.pieceX--;
        this.ctx.audio.playCursor();
      }
    } else if (input.justPressed(BUTTONS.RIGHT)) {
      if (!this.collides(this.currentPiece.shape, this.pieceX + 1, this.pieceY)) {
        this.pieceX++;
        this.ctx.audio.playCursor();
      }
    }

    // Rotate (A button or Up)
    if (input.justPressed(BUTTONS.A) || input.justPressed(BUTTONS.UP)) {
      this.rotate();
    }

    // Hold (B button or Select)
    if (input.justPressed(BUTTONS.B) || input.justPressed(BUTTONS.SELECT)) {
      this.hold();
    }

    // Soft drop
    let interval = this.dropInterval;
    const isSoftDropping = input.isDown(BUTTONS.DOWN);
    if (isSoftDropping) {
      interval = 0.05;
    }

    // Step downward
    this.dropTimer += dt;
    if (this.dropTimer >= interval) {
      this.dropTimer = 0;
      if (!this.collides(this.currentPiece.shape, this.pieceX, this.pieceY + 1)) {
        this.pieceY++;
        if (isSoftDropping) {
          this.score += 1;
          if (this.ctx.onScoreUpdate) this.ctx.onScoreUpdate(this.score);
        }
      } else {
        this.lockPiece();
      }
    }
  }

  render(r) {
    r.clear(3);

    // Playfield border
    const bw = this.boardWidth * this.cellSize;
    const bh = this.boardHeight * this.cellSize;
    r.strokeRect(this.boardX - 1, this.boardY - 1, bw + 2, bh + 2, 0);

    // Grid cells
    for (let row = 0; row < this.boardHeight; row++) {
      const isClearing = this.clearingLines.includes(row);
      for (let col = 0; col < this.boardWidth; col++) {
        const val = this.grid[row][col];
        const cx = this.boardX + col * this.cellSize;
        const cy = this.boardY + row * this.cellSize;

        if (isClearing) {
          r.fillRect(cx, cy, this.cellSize, this.cellSize, 3);
        } else if (val !== null) {
          r.fillRect(cx + 1, cy + 1, this.cellSize - 1, this.cellSize - 1, val);
          r.strokeRect(cx, cy, this.cellSize, this.cellSize, 0);
        }
      }
    }

    // Current falling piece
    if (this.currentPiece && this.clearFlashTimer <= 0) {
      const { shape, shade } = this.currentPiece;
      for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
          if (shape[row][col]) {
            const cx = this.boardX + (this.pieceX + col) * this.cellSize;
            const cy = this.boardY + (this.pieceY + row) * this.cellSize;
            if (cy >= this.boardY) {
              r.fillRect(cx + 1, cy + 1, this.cellSize - 1, this.cellSize - 1, shade);
              r.strokeRect(cx, cy, this.cellSize, this.cellSize, 0);
            }
          }
        }
      }
    }

    // Right Sidebar / HUD
    const hudX = 88;
    r.text('TETRIS', hudX + 8, 8, 0, 1);

    r.text(`SCORE:`, hudX, 22, 1);
    r.text(`${this.score}`, hudX, 30, 0);

    r.text(`LEVEL: ${this.level}`, hudX, 42, 1);
    r.text(`LINES: ${this.lines}`, hudX, 52, 1);

    // Next piece preview
    r.text('NEXT', hudX, 66, 1);
    r.strokeRect(hudX - 2, 74, 38, 28, 0);
    if (this.nextPiece) {
      const ns = this.nextPiece.shape;
      for (let nr = 0; nr < ns.length; nr++) {
        for (let nc = 0; nc < ns[nr].length; nc++) {
          if (ns[nr][nc]) {
            r.fillRect(hudX + 6 + nc * 6, 78 + nr * 6, 5, 5, this.nextPiece.shade);
          }
        }
      }
    }

    // Hold piece preview
    r.text('HOLD', hudX, 106, 1);
    r.strokeRect(hudX - 2, 114, 38, 24, 0);
    if (this.holdPiece) {
      const hs = TETROMINOES[this.holdPiece].shape;
      for (let hr = 0; hr < hs.length; hr++) {
        for (let hc = 0; hc < hs[hr].length; hc++) {
          if (hs[hr][hc]) {
            r.fillRect(hudX + 6 + hc * 5, 118 + hr * 5, 4, 4, TETROMINOES[this.holdPiece].shade);
          }
        }
      }
    }

    // How to Play / Title Screen Overlay
    if (this.inTitle) {
      r.fillRect(8, 16, 144, 118, 3);
      r.strokeRect(8, 16, 144, 118, 0);
      r.strokeRect(10, 18, 140, 114, 1);

      r.textCentered('TETRIS', 22, 0, 1);
      r.textCentered('BLOCK PUZZLE RETRO', 32, 1, 1);
      r.line(16, 42, 144, 42, 1);

      r.textCentered('NOTICE: HOW TO PLAY', 46, 1, 1);
      r.text('◄ / ►: SHIFT BLOCK', 16, 58, 0);
      r.text('A / Z / ▲: ROTATE PIECE', 16, 70, 0);
      r.text('▼: SOFT DROP | B: HOLD', 16, 82, 0);
      r.text('FILL COMPLETE ROWS TO CLEAR', 16, 94, 1);

      r.fillRect(18, 108, 124, 16, 0);
      r.textCentered('PRESS A OR START', 112, 3, 1);
    }

    // Game Over Overlay
    if (this.gameOver) {
      r.fillRect(20, 36, 120, 74, 3);
      r.strokeRect(20, 36, 120, 74, 0);
      r.strokeRect(22, 38, 116, 70, 1);
      r.textCentered('GAME OVER', 46, 0, 1);
      r.textCentered(`SCORE: ${this.score}`, 62, 1, 1);
      r.textCentered(`BEST: ${this.highScore}`, 76, 1, 1);
      r.fillRect(28, 90, 104, 14, 0);
      r.textCentered('PRESS A TO RETRY', 94, 3, 1);
    }

    // Pause Overlay
    if (this.paused && !this.gameOver && !this.inTitle) {
      r.fillRect(40, 58, 80, 28, 3);
      r.strokeRect(40, 58, 80, 28, 0);
      r.textCentered('PAUSED', 64, 0, 1);
      r.textCentered('START: RESUME', 74, 1, 1);
    }
  }
}
