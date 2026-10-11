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
    this.reset();
  }

  reset() {
    this.score = 0;
    this.gameOver = false;
    this.inTitle = false;
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

    // Self collision
    for (let i = 0; i < this.snake.length; i++) {
      if (this.snake[i].x === head.x && this.snake[i].y === head.y) {
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
    if (head.x === this.food.x && head.y === this.food.y) {
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

    // Title Overlay
    if (this.inTitle) {
      r.fillRect(20, 35, 120, 75, 3);
      r.strokeRect(20, 35, 120, 75, 0);
      r.textCentered('SNAKE', 48, 0, 2);
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
}
