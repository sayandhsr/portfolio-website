// Bubble Shooter Game (160x144 Game Boy Canvas)
import { BUTTONS } from '../InputManager.js';

export const BUBBLE_TYPES = [0, 1, 2, 3]; // 4 distinct patterns

export const findMatches = (grid, startR, startC) => {
  const type = grid[startR]?.[startC];
  if (type === null || type === undefined) return [];

  const visited = new Set();
  const queue = [{ r: startR, c: startC }];
  visited.add(`${startR},${startC}`);
  const matches = [];

  while (queue.length > 0) {
    const { r, c } = queue.shift();
    matches.push({ r, c });

    // Hex neighbor offsets
    const isOdd = r % 2 === 1;
    const neighbors = isOdd
      ? [
          { r: r - 1, c: c }, { r: r - 1, c: c + 1 },
          { r: r, c: c - 1 }, { r: r, c: c + 1 },
          { r: r + 1, c: c }, { r: r + 1, c: c + 1 }
        ]
      : [
          { r: r - 1, c: c - 1 }, { r: r - 1, c: c },
          { r: r, c: c - 1 }, { r: r, c: c + 1 },
          { r: r + 1, c: c - 1 }, { r: r + 1, c: c }
        ];

    for (const n of neighbors) {
      if (
        n.r >= 0 && n.r < grid.length &&
        n.c >= 0 && n.c < (n.r % 2 === 1 ? grid[n.r].length : grid[n.r].length) &&
        grid[n.r][n.c] === type &&
        !visited.has(`${n.r},${n.c}`)
      ) {
        visited.add(`${n.r},${n.c}`);
        queue.push(n);
      }
    }
  }

  return matches.length >= 3 ? matches : [];
};

export const findOrphans = (grid) => {
  const connected = new Set();
  const queue = [];

  // Seed with all non-empty bubbles in row 0
  for (let c = 0; c < grid[0].length; c++) {
    if (grid[0][c] !== null) {
      connected.add(`0,${c}`);
      queue.push({ r: 0, c });
    }
  }

  while (queue.length > 0) {
    const { r, c } = queue.shift();
    const isOdd = r % 2 === 1;
    const neighbors = isOdd
      ? [
          { r: r - 1, c: c }, { r: r - 1, c: c + 1 },
          { r: r, c: c - 1 }, { r: r, c: c + 1 },
          { r: r + 1, c: c }, { r: r + 1, c: c + 1 }
        ]
      : [
          { r: r - 1, c: c - 1 }, { r: r - 1, c: c },
          { r: r, c: c - 1 }, { r: r, c: c + 1 },
          { r: r + 1, c: c - 1 }, { r: r + 1, c: c }
        ];

    for (const n of neighbors) {
      if (
        n.r >= 0 && n.r < grid.length &&
        n.c >= 0 && n.c < grid[n.r].length &&
        grid[n.r][n.c] !== null &&
        !connected.has(`${n.r},${n.c}`)
      ) {
        connected.add(`${n.r},${n.c}`);
        queue.push(n);
      }
    }
  }

  const orphans = [];
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c] !== null && !connected.has(`${r},${c}`)) {
        orphans.push({ r, c, type: grid[r][c] });
      }
    }
  }
  return orphans;
};

export default class BubbleGame {
  constructor() {
    this.ctx = null;
    this.score = 0;
    this.highScore = 0;
    this.gameOver = false;
    this.paused = false;
    this.inTitle = true;

    this.cols = 10;
    this.maxRows = 11;
    this.bubbleRadius = 6;
    this.bubbleDia = 12;
    this.gridStartX = 20;
    this.gridStartY = 16;

    this.grid = [];
    this.aimAngle = -Math.PI / 2; // Straight up

    this.currentBubble = 0;
    this.nextBubble = 1;
    this.flyingBubble = null;

    this.shotCount = 0;
    this.shotsBeforeCeiling = 6;
  }

  init(ctx) {
    this.ctx = ctx;
    this.highScore = ctx.storage.getHighScore('bubble');
    this.reset();
  }

  reset() {
    this.score = 0;
    this.gameOver = false;
    this.inTitle = false;
    this.shotCount = 0;
    this.aimAngle = -Math.PI / 2;
    this.flyingBubble = null;

    // Build initial grid (top 4 rows filled)
    this.grid = [];
    for (let r = 0; r < this.maxRows; r++) {
      const rowLen = r % 2 === 1 ? this.cols - 1 : this.cols;
      const row = [];
      for (let c = 0; c < rowLen; c++) {
        if (r < 4) {
          row.push(Math.floor(Math.random() * 4));
        } else {
          row.push(null);
        }
      }
      this.grid.push(row);
    }

    this.currentBubble = Math.floor(Math.random() * 4);
    this.nextBubble = Math.floor(Math.random() * 4);
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

    // Aim controls
    const aimSpeed = 2.0 * dt;
    if (input.isDown(BUTTONS.LEFT)) {
      this.aimAngle = Math.max(-Math.PI * 0.9, this.aimAngle - aimSpeed);
    }
    if (input.isDown(BUTTONS.RIGHT)) {
      this.aimAngle = Math.min(-Math.PI * 0.1, this.aimAngle + aimSpeed);
    }

    // Launch bubble
    if (!this.flyingBubble && input.justPressed(BUTTONS.A)) {
      const speed = 220;
      this.flyingBubble = {
        x: 80,
        y: 130,
        dx: Math.cos(this.aimAngle) * speed,
        dy: Math.sin(this.aimAngle) * speed,
        type: this.currentBubble
      };
      this.currentBubble = this.nextBubble;
      this.nextBubble = Math.floor(Math.random() * 4);
      this.ctx.audio.playJump();
    }

    // Update flying bubble
    if (this.flyingBubble) {
      this.flyingBubble.x += this.flyingBubble.dx * dt;
      this.flyingBubble.y += this.flyingBubble.dy * dt;

      // Bounce on left/right walls
      const minX = this.gridStartX;
      const maxX = this.gridStartX + this.cols * this.bubbleDia;
      if (this.flyingBubble.x - this.bubbleRadius <= minX) {
        this.flyingBubble.x = minX + this.bubbleRadius;
        this.flyingBubble.dx = -this.flyingBubble.dx;
        this.ctx.audio.playHit();
      } else if (this.flyingBubble.x + this.bubbleRadius >= maxX) {
        this.flyingBubble.x = maxX - this.bubbleRadius;
        this.flyingBubble.dx = -this.flyingBubble.dx;
        this.ctx.audio.playHit();
      }

      // Check collision with top ceiling or existing bubbles
      let collided = false;
      if (this.flyingBubble.y - this.bubbleRadius <= this.gridStartY) {
        collided = true;
      } else {
        // Check collision against all grid bubbles
        for (let r = 0; r < this.grid.length && !collided; r++) {
          for (let c = 0; c < this.grid[r].length; c++) {
            if (this.grid[r][c] !== null) {
              const pos = this.getBubblePos(r, c);
              const dist = Math.hypot(this.flyingBubble.x - pos.x, this.flyingBubble.y - pos.y);
              if (dist <= this.bubbleDia - 2) {
                collided = true;
                break;
              }
            }
          }
        }
      }

      if (collided) {
        this.snapToGrid(this.flyingBubble);
        this.flyingBubble = null;
      }
    }
  }

  getBubblePos(r, c) {
    const isOdd = r % 2 === 1;
    const x = this.gridStartX + c * this.bubbleDia + (isOdd ? this.bubbleRadius : 0) + this.bubbleRadius;
    const y = this.gridStartY + r * (this.bubbleDia - 2) + this.bubbleRadius;
    return { x, y };
  }

  snapToGrid(bubble) {
    let bestR = 0;
    let bestC = 0;
    let minDist = Infinity;

    for (let r = 0; r < this.grid.length; r++) {
      for (let c = 0; c < this.grid[r].length; c++) {
        if (this.grid[r][c] === null) {
          const pos = this.getBubblePos(r, c);
          const dist = Math.hypot(bubble.x - pos.x, bubble.y - pos.y);
          if (dist < minDist) {
            minDist = dist;
            bestR = r;
            bestC = c;
          }
        }
      }
    }

    this.grid[bestR][bestC] = bubble.type;
    this.shotCount++;

    // Check matches
    const matches = findMatches(this.grid, bestR, bestC);
    if (matches.length >= 3) {
      for (const m of matches) {
        this.grid[m.r][m.c] = null;
      }
      this.score += matches.length * 15;
      this.ctx.audio.playCoin();

      // Check orphans
      const orphans = findOrphans(this.grid);
      if (orphans.length > 0) {
        for (const o of orphans) {
          this.grid[o.r][o.c] = null;
        }
        this.score += orphans.length * 30;
        this.ctx.audio.playPowerup();
      }

      if (this.ctx.onScoreUpdate) this.ctx.onScoreUpdate(this.score);
    } else {
      this.ctx.audio.playHit();
    }

    // Check descending ceiling
    if (this.shotCount % this.shotsBeforeCeiling === 0) {
      this.descendCeiling();
    }

    // Check game over (any bubble reached bottom rows)
    const bottomRow = this.grid[this.maxRows - 1];
    if (bottomRow && bottomRow.some(b => b !== null)) {
      this.gameOver = true;
      this.ctx.audio.playGameOver();
      if (this.ctx.storage.setHighScore('bubble', this.score)) {
        this.highScore = this.score;
      }
    }
  }

  descendCeiling() {
    const newRow = [];
    for (let c = 0; c < this.cols; c++) {
      newRow.push(Math.floor(Math.random() * 4));
    }
    this.grid.pop();
    this.grid.unshift(newRow);
    this.ctx.renderer.shake(2, 0.2);
  }

  render(r) {
    r.clear(3);

    // Top HUD
    r.fillRect(0, 0, 160, 14, 1);
    r.text(`BUBBLE`, 4, 4, 3);
    r.text(`SCR:${this.score}`, 58, 4, 3);
    r.text(`HI:${this.highScore}`, 115, 4, 3);

    // Walls
    const minX = this.gridStartX - 1;
    const maxX = this.gridStartX + this.cols * this.bubbleDia;
    r.line(minX, 14, minX, 144, 0);
    r.line(maxX, 14, maxX, 144, 0);

    // Deadline at bottom
    r.line(minX, 120, maxX, 120, 2);

    // Draw Grid Bubbles
    for (let row = 0; row < this.grid.length; row++) {
      for (let col = 0; col < this.grid[row].length; col++) {
        const type = this.grid[row][col];
        if (type !== null) {
          const pos = this.getBubblePos(row, col);
          this.renderBubble(r, pos.x, pos.y, type);
        }
      }
    }

    // Aim Line
    const launcherX = 80;
    const launcherY = 132;
    const aimLen = 25;
    r.line(
      launcherX,
      launcherY,
      launcherX + Math.cos(this.aimAngle) * aimLen,
      launcherY + Math.sin(this.aimAngle) * aimLen,
      0
    );

    // Current Bubble in launcher
    if (!this.flyingBubble) {
      this.renderBubble(r, launcherX, launcherY, this.currentBubble);
    }

    // Flying Bubble
    if (this.flyingBubble) {
      this.renderBubble(r, this.flyingBubble.x, this.flyingBubble.y, this.flyingBubble.type);
    }

    // Next Bubble preview
    r.text('NEXT:', 4, 130, 0);
    this.renderBubble(r, 142, 132, this.nextBubble);

    // Title Overlay
    if (this.inTitle) {
      r.fillRect(20, 35, 120, 75, 3);
      r.strokeRect(20, 35, 120, 75, 0);
      r.textCentered('BUBBLE SHOOTER', 48, 0, 1);
      r.textCentered('PRESS A OR START', 75, 1, 1);
      r.textCentered(`HIGH SCORE: ${this.highScore}`, 92, 0, 1);
    }

    // Game Over Overlay
    if (this.gameOver) {
      r.fillRect(25, 40, 110, 68, 3);
      r.strokeRect(25, 40, 110, 68, 0);
      r.textCentered('GAME OVER', 52, 0, 1);
      r.textCentered(`SCORE: ${this.score}`, 68, 1, 1);
      r.textCentered('PRESS A TO RETRY', 85, 0, 1);
    }

    // Pause Overlay
    if (this.paused && !this.gameOver && !this.inTitle) {
      r.fillRect(40, 60, 80, 26, 3);
      r.strokeRect(40, 60, 80, 26, 0);
      r.textCentered('PAUSED', 70, 0, 1);
    }
  }

  renderBubble(r, x, y, type) {
    const rad = this.bubbleRadius - 1;
    // Outer circle
    r.circle(x, y, rad, 0, false);

    // 4 distinct interior patterns:
    if (type === 0) {
      // Solid dark center
      r.circle(x, y, rad - 2, 0, true);
    } else if (type === 1) {
      // Cross pattern
      r.line(x - 2, y, x + 2, y, 1);
      r.line(x, y - 2, x, y + 2, 1);
    } else if (type === 2) {
      // Diamond pattern
      r.fillRect(x - 1, y - 1, 3, 3, 2);
      r.fillRect(x, y - 2, 1, 1, 2);
      r.fillRect(x, y + 2, 1, 1, 2);
    } else {
      // Ring pattern
      r.circle(x, y, 2, 1, false);
    }
  }
}
