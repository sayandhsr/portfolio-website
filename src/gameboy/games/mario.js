// Super Mario Land 2: 6 Golden Coins (Original Platformer for 160x144 Game Boy Canvas)
import { BUTTONS } from '../InputManager.js';

export default class MarioGame {
  constructor() {
    this.ctx = null;
    this.score = 0;
    this.coins = 0;
    this.goldenCoins = 0;
    this.lives = 3;
    this.timeLeft = 200;
    this.level = 1;
    this.gameOver = false;
    this.gameWon = false;
    this.paused = false;
    this.inTitle = true;

    // Player state
    this.px = 20;
    this.py = 100;
    this.vx = 0;
    this.vy = 0;
    this.isGrounded = false;
    this.isSuper = false; // Power-up
    this.facingRight = true;
    this.invulnerableTimer = 0;

    // Jump physics
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.gravity = 650;
    this.jumpForce = -230;
    this.moveSpeed = 90;

    // Camera
    this.cameraX = 0;

    // Level map & entities
    this.tiles = [];
    this.enemies = [];
    this.blocks = [];
    this.pickups = [];
    this.flagX = 600;
  }

  init(ctx) {
    this.ctx = ctx;
    this.reset();
  }

  reset() {
    this.score = 0;
    this.coins = 0;
    this.goldenCoins = 0;
    this.lives = 3;
    this.level = 1;
    this.gameOver = false;
    this.gameWon = false;
    this.inTitle = false;
    this.loadLevel(1);
  }

  loadLevel(lvl) {
    this.level = lvl;
    this.timeLeft = 200;
    this.px = 24;
    this.py = 90;
    this.vx = 0;
    this.vy = 0;
    this.cameraX = 0;
    this.invulnerableTimer = 0;

    // Generate terrain for level
    this.flagX = 720;
    this.blocks = [
      { x: 80, y: 88, type: '?', hit: false },
      { x: 96, y: 88, type: 'brick', hit: false },
      { x: 112, y: 88, type: '?', hit: false, hasSuper: true },
      { x: 200, y: 72, type: '?', hit: false, hasGoldenCoin: true },
      { x: 320, y: 88, type: '?', hit: false },
      { x: 450, y: 72, type: '?', hit: false, hasGoldenCoin: true }
    ];

    this.enemies = [
      { x: 140, y: 112, vx: -30, alive: true, type: 'walker' },
      { x: 260, y: 112, vx: -30, alive: true, type: 'walker' },
      { x: 380, y: 112, vx: -35, alive: true, type: 'walker' },
      { x: 520, y: 112, vx: -40, alive: true, type: 'walker' }
    ];

    this.pickups = [
      { x: 160, y: 108, type: 'coin', taken: false },
      { x: 172, y: 108, type: 'coin', taken: false },
      { x: 184, y: 108, type: 'coin', taken: false }
    ];
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

    if (this.gameOver || this.gameWon) {
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

    // Timer countdown
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) {
      this.die();
      return;
    }

    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
    }

    // Horizontal movement
    const runMultiplier = input.isDown(BUTTONS.B) ? 1.4 : 1.0;
    const currentSpeed = this.moveSpeed * runMultiplier;

    if (input.isDown(BUTTONS.LEFT)) {
      this.vx = -currentSpeed;
      this.facingRight = false;
    } else if (input.isDown(BUTTONS.RIGHT)) {
      this.vx = currentSpeed;
      this.facingRight = true;
    } else {
      this.vx = 0;
    }

    // Jump Buffering and Coyote Time
    if (this.isGrounded) {
      this.coyoteTimer = 0.12;
    } else {
      this.coyoteTimer -= dt;
    }

    if (input.justPressed(BUTTONS.A)) {
      this.jumpBufferTimer = 0.12;
    } else {
      this.jumpBufferTimer -= dt;
    }

    // Trigger jump
    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      this.vy = this.jumpForce;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
      this.isGrounded = false;
      this.ctx.audio.playJump();
    }

    // Variable jump height (releasing A cuts upward velocity)
    if (!input.isDown(BUTTONS.A) && this.vy < -80) {
      this.vy = -80;
    }

    // Apply gravity
    this.vy += this.gravity * dt;

    // Move player
    this.px += this.vx * dt;
    this.py += this.vy * dt;

    // Floor collision (ground at y=120)
    const groundY = 120;
    const pHeight = this.isSuper ? 16 : 10;
    if (this.py + pHeight >= groundY) {
      this.py = groundY - pHeight;
      this.vy = 0;
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
    }

    // Prevent moving left past camera
    if (this.px < this.cameraX) {
      this.px = this.cameraX;
    }

    // Check block collisions
    for (const b of this.blocks) {
      // Player hitting block from below
      if (
        this.vy < 0 &&
        this.px + 8 > b.x && this.px < b.x + 14 &&
        this.py <= b.y + 12 && this.py >= b.y
      ) {
        this.vy = 40;
        if (!b.hit) {
          b.hit = true;
          this.ctx.audio.playHit();
          if (b.hasGoldenCoin) {
            this.goldenCoins++;
            this.score += 500;
            this.ctx.audio.playPowerup();
          } else if (b.hasSuper && !this.isSuper) {
            this.isSuper = true;
            this.score += 200;
            this.ctx.audio.playPowerup();
          } else {
            this.coins++;
            this.score += 50;
            this.ctx.audio.playCoin();
          }
        }
      }
    }

    // Pickups collision
    for (const p of this.pickups) {
      if (!p.taken && Math.hypot(this.px - p.x, this.py - p.y) < 12) {
        p.taken = true;
        this.coins++;
        this.score += 50;
        this.ctx.audio.playCoin();
      }
    }

    // Enemies update & collision
    for (const e of this.enemies) {
      if (!e.alive) continue;
      e.x += e.vx * dt;

      // Enemy bounce back at edges
      if (e.x < 100 || e.x > 680) e.vx = -e.vx;

      // Check collision with player
      const eHeight = 10;
      const dist = Math.hypot(this.px - e.x, (this.py + pHeight/2) - (e.y + eHeight/2));
      if (dist < 10) {
        // Player stomping enemy from above
        if (this.vy > 0 && this.py + pHeight <= e.y + 6) {
          e.alive = false;
          this.vy = -160;
          this.score += 100;
          this.ctx.audio.playHit();
        } else if (this.invulnerableTimer <= 0) {
          if (this.isSuper) {
            this.isSuper = false;
            this.invulnerableTimer = 1.5;
            this.ctx.audio.playHit();
          } else {
            this.die();
            return;
          }
        }
      }
    }

    // Flag / Goal reaching
    if (this.px >= this.flagX) {
      this.ctx.audio.playPowerup();
      if (this.level < 3) {
        this.loadLevel(this.level + 1);
      } else {
        this.gameWon = true;
        this.score += 1000 + Math.floor(this.timeLeft) * 5;
        this.ctx.storage.setHighScore('mario', this.score);
      }
    }

    // Camera follow player smoothly
    const targetCamX = Math.max(0, this.px - 60);
    this.cameraX += (targetCamX - this.cameraX) * 0.1;
  }

  die() {
    this.lives--;
    this.ctx.audio.playGameOver();
    this.ctx.renderer.shake(4, 0.3);
    if (this.lives <= 0) {
      this.gameOver = true;
      this.ctx.storage.setHighScore('mario', this.score);
    } else {
      this.loadLevel(this.level);
    }
  }

  render(r) {
    r.clear(3);

    // Top HUD
    r.fillRect(0, 0, 160, 14, 1);
    r.text(`M${this.level}`, 4, 4, 3);
    r.text(`$x${this.coins}`, 34, 4, 3);
    r.text(`★x${this.goldenCoins}/6`, 72, 4, 3);
    r.text(`T:${Math.floor(this.timeLeft)}`, 130, 4, 3);

    const cx = Math.floor(this.cameraX);

    // Ground platform
    r.fillRect(0, 120, 160, 24, 1);
    for (let gx = - (cx % 16); gx < 160; gx += 16) {
      r.line(gx, 120, gx, 144, 0);
    }

    // Blocks
    for (const b of this.blocks) {
      const bx = Math.floor(b.x - cx);
      if (bx >= -16 && bx <= 160) {
        r.fillRect(bx, b.y, 14, 14, b.hit ? 2 : 1);
        r.strokeRect(bx, b.y, 14, 14, 0);
        r.text(b.hit ? '•' : '?', bx + 4, b.y + 4, 0);
      }
    }

    // Pickups (coins)
    for (const p of this.pickups) {
      if (!p.taken) {
        const px = Math.floor(p.x - cx);
        if (px >= -8 && px <= 160) {
          r.circle(px + 4, p.y + 4, 4, 0, false);
          r.fillRect(px + 3, p.y + 2, 2, 4, 1);
        }
      }
    }

    // Enemies (stompable walkers)
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const ex = Math.floor(e.x - cx);
      if (ex >= -16 && ex <= 160) {
        r.fillRect(ex, e.y, 10, 8, 0);
        r.fillRect(ex + 1, e.y + 8, 3, 2, 1);
        r.fillRect(ex + 6, e.y + 8, 3, 2, 1);
        r.circle(ex + 3, e.y + 3, 1, 3, true);
        r.circle(ex + 7, e.y + 3, 1, 3, true);
      }
    }

    // Goal Flag
    const fx = Math.floor(this.flagX - cx);
    if (fx >= -20 && fx <= 160) {
      r.fillRect(fx, 60, 2, 60, 0);
      r.fillRect(fx + 2, 62, 12, 8, 1);
      r.strokeRect(fx + 2, 62, 12, 8, 0);
    }

    // Player
    const playerScreenX = Math.floor(this.px - cx);
    const pHeight = this.isSuper ? 16 : 10;
    if (this.invulnerableTimer <= 0 || Math.floor(Date.now() / 80) % 2 === 0) {
      r.fillRect(playerScreenX, Math.floor(this.py), 8, pHeight, 0);
      // Cap/face detail
      r.fillRect(playerScreenX + (this.facingRight ? 2 : 0), Math.floor(this.py), 6, 3, 1);
    }

    // Title Overlay
    if (this.inTitle) {
      r.fillRect(15, 30, 130, 85, 3);
      r.strokeRect(15, 30, 130, 85, 0);
      r.textCentered('MARIO LAND 2', 42, 0, 1);
      r.textCentered('6 GOLDEN COINS', 54, 1, 1);
      r.textCentered('PRESS A OR START', 78, 0, 1);
      r.textCentered('Z: JUMP | X: RUN', 96, 1, 1);
    }

    // Game Over Overlay
    if (this.gameOver) {
      r.fillRect(25, 40, 110, 68, 3);
      r.strokeRect(25, 40, 110, 68, 0);
      r.textCentered('GAME OVER', 52, 0, 1);
      r.textCentered(`SCORE: ${this.score}`, 68, 1, 1);
      r.textCentered('PRESS A TO RETRY', 85, 0, 1);
    }

    // Victory Overlay
    if (this.gameWon) {
      r.fillRect(20, 35, 120, 75, 3);
      r.strokeRect(20, 35, 120, 75, 0);
      r.textCentered('COURSE CLEAR!', 48, 0, 1);
      r.textCentered(`GOLDEN COINS: ${this.goldenCoins}/6`, 64, 1, 1);
      r.textCentered(`FINAL SCORE: ${this.score}`, 80, 0, 1);
      r.textCentered('PRESS A TO RESTART', 96, 1, 1);
    }

    // Pause Overlay
    if (this.paused && !this.gameOver && !this.gameWon && !this.inTitle) {
      r.fillRect(40, 60, 80, 26, 3);
      r.strokeRect(40, 60, 80, 26, 0);
      r.textCentered('PAUSED', 70, 0, 1);
    }
  }
}
