// Snake Game (Migrated & Adapted to 160x144 Game Boy Canvas)
import { BUTTONS } from '../InputManager.js';

export default class SnakeGame {
  constructor() {
    this.ctx = null;
    this.score = 0;
    this.highScore = 0;
    this.gameOver = false;
    this.paused = false;
    this.inTitle = true;

    // Grid: 160 x 144 screen
    // Cell size: 8x8 -> 20 columns, 16 rows (top 16px reserved for HUD -> 160x128 playfield = 20x16 grid)
    this.cols = 20;
    this.rows = 16;
    this.hudHeight = 16;
    this.gridSize = 8;

    this.snake = [];
    this.food = { x: 14, y: 8 };
    this.dir = { x: 1, y: 0 };
    this.nextDir = { x: 1, y: 0 };

    this.moveTimer = 0;
    this.baseSpeed = 0.12; // seconds per step
    this.speed = this.baseSpeed;
  }

  init(ctx) {
    this.ctx = ctx;
    this.highScore = ctx.storage.getHighScore('snake');
    this.inTitle = true;
    this.reset(true);
  }

  reset(keepTitle = false) {
    this.score = 0;
    this.gameOver = false;
    if (!keepTitle) {
      this.inTitle = false;
    }
    this.snake = [
      { x: 10, y: 8 },
      { x: 9, y: 8 },
      { x: 8, y: 8 }
    ];
    this.dir = { x: 1, y: 0 };
    this.nextDir = { x: 1, y: 0 };
    this.speed = this.baseSpeed;
    this.moveTimer = 0;
    this.spawnFood();
  }

  spawnFood() {
    let valid = false;
    let attempts = 0;
    while (!valid && attempts < 100) {
      attempts++;
      const fx = Math.floor(Math.random() * this.cols);
      const fy = Math.floor(Math.random() * this.rows);
      if (!this.snake.some(segment => segment.x === fx && segment.y === fy)) {
        this.food = { x: fx, y: fy };
        valid = true;
      }
    }
  }

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
  }

  destroy() {
    // Cleanup
  }

  getScore() {
    return this.score;
  }

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

    // Direction input with 180° reversal prevention
    if (input.justPressed(BUTTONS.UP) && this.dir.y === 0) {
      this.nextDir = { x: 0, y: -1 };
    } else if (input.justPressed(BUTTONS.DOWN) && this.dir.y === 0) {
      this.nextDir = { x: 0, y: 1 };
    } else if (input.justPressed(BUTTONS.LEFT) && this.dir.x === 0) {
      this.nextDir = { x: -1, y: 0 };
    } else if (input.justPressed(BUTTONS.RIGHT) && this.dir.x === 0) {
      this.nextDir = { x: 1, y: 0 };
    }

    // Step timer
    this.moveTimer += dt;
    if (this.moveTimer >= this.speed) {
      this.moveTimer -= this.speed;
      this.step();
    }
  }

  step() {
    this.dir = { ...this.nextDir };
    const head = {
      x: this.snake[0].x + this.dir.x,
      y: this.snake[0].y + this.dir.y
    };

    // Wall wrapping
    if (head.x < 0) head.x = this.cols - 1;
    if (head.x >= this.cols) head.x = 0;
    if (head.y < 0) head.y = this.rows - 1;
    if (head.y >= this.rows) head.y = 0;

    // Self collision (exclude vacating tail segment if not eating food)
    const willEat = (head.x === this.food.x && head.y === this.food.y);
    const bodyToCheck = willEat ? this.snake : this.snake.slice(0, -1);
    for (let i = 0; i < bodyToCheck.length; i++) {
      if (bodyToCheck[i].x === head.x && bodyToCheck[i].y === head.y) {
        this.gameOver = true;
        this.ctx.audio.playGameOver();
        this.ctx.renderer.shake(4, 0.3);
        if (this.ctx.storage.setHighScore('snake', this.score)) {
          this.highScore = this.score;
        }
        return;
      }
    }

    this.snake.unshift(head);

    // Food collision
    if (willEat) {
      this.score += 10;
      this.ctx.audio.playCoin();
      if (this.ctx.onScoreUpdate) this.ctx.onScoreUpdate(this.score);
      // Speed up slightly
      this.speed = Math.max(0.05, this.baseSpeed - Math.floor(this.score / 50) * 0.01);
      this.spawnFood();
    } else {
      this.snake.pop();
    }
  }

  render(r) {
    r.clear(3); // Screen background (lightest shade)

    // HUD Bar
    r.fillRect(0, 0, 160, this.hudHeight, 1);
    r.text(`SCORE:${this.score}`, 4, 5, 3);
    r.text(`HI:${this.highScore}`, 110, 5, 3);

    // Border around play area
    r.strokeRect(0, this.hudHeight, 160, 144 - this.hudHeight, 0);

    // Food (blinking apple sprite)
    const fx = this.food.x * this.gridSize;
    const fy = this.hudHeight + this.food.y * this.gridSize;
    r.fillRect(fx + 2, fy + 1, 4, 6, 0);
    r.fillRect(fx + 1, fy + 2, 6, 4, 0);
    r.fillRect(fx + 3, fy, 2, 2, 1); // stem

    // Snake Body
    for (let i = 0; i < this.snake.length; i++) {
      const seg = this.snake[i];
      const sx = seg.x * this.gridSize;
      const sy = this.hudHeight + seg.y * this.gridSize;
      if (i === 0) {
        // Head
        r.fillRect(sx, sy, this.gridSize, this.gridSize, 0);
        r.fillRect(sx + 2, sy + 2, 2, 2, 3); // eye
      } else {
        // Body
        r.fillRect(sx + 1, sy + 1, this.gridSize - 2, this.gridSize - 2, 1);
        r.fillRect(sx + 2, sy + 2, this.gridSize - 4, this.gridSize - 4, 0);
      }
    }

    // How to Play / Title Screen Overlay
    if (this.inTitle) {
      r.fillRect(8, 16, 144, 118, 3);
      r.strokeRect(8, 16, 144, 118, 0);
      r.strokeRect(10, 18, 140, 114, 1);

      r.textCentered('SNAKE ARCADE', 22, 0, 1);
      r.textCentered('CLASSIC RETRO EDITION', 32, 1, 1);
      r.line(16, 42, 144, 42, 1);

      r.textCentered('NOTICE: HOW TO PLAY', 46, 1, 1);
      r.text('ARROWS/WASD: TURN SNAKE', 16, 58, 0);
      r.text('SWIPES ALSO CONTROL TURNS', 16, 70, 0);
      r.text('DEVOUR APPLES TO GROW & SCORE', 16, 82, 0);
      r.text('AVOID CRASHING INTO YOUR BODY', 16, 94, 1);

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
