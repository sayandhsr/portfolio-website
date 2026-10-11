// Donkey Kong Land (Ape Platformer with Barrel Toss & Tag Team Swap)
import { BUTTONS } from '../InputManager.js';

export default class DonkeyKongGame {
  constructor() {
    this.ctx = null;
    this.score = 0;
    this.bananas = 0;
    this.lives = 3;
    this.level = 1;
    this.gameOver = false;
    this.gameWon = false;
    this.paused = false;
    this.inTitle = true;

    // Active Character: 'DK' (heavy, stronger) or 'Diddy' (faster, agile)
    this.char = 'DK';

    this.px = 24;
    this.py = 100;
    this.vx = 0;
    this.vy = 0;
    this.isGrounded = false;
    this.isClimbing = false;
    this.facingRight = true;
    this.hasBarrel = false;

    this.cameraX = 0;
    this.vines = [];
    this.barrels = [];
    this.enemies = [];
    this.thrownBarrels = [];
    this.exitX = 640;
  }

  init(ctx) {
    this.ctx = ctx;
    this.inTitle = true;
    this.reset(true);
  }

  reset(keepTitle = false) {
    this.score = 0;
    this.bananas = 0;
    this.lives = 3;
    this.char = 'DK';
    this.gameOver = false;
    this.gameWon = false;
    if (!keepTitle) {
      this.inTitle = false;
    }
    this.loadLevel(1);
  }

  loadLevel(lvl) {
    this.level = lvl;
    this.px = 24;
    this.py = 100;
    this.vx = 0;
    this.vy = 0;
    this.cameraX = 0;
    this.hasBarrel = false;
    this.thrownBarrels = [];

    // Vines (vertical lines from y=30 to y=110)
    this.vines = [
      { x: 120, top: 40, bottom: 120 },
      { x: 280, top: 30, bottom: 120 },
      { x: 440, top: 40, bottom: 120 }
    ];

    // Collectible barrels
    this.barrels = [
      { x: 70, y: 110, collected: false },
      { x: 230, y: 110, collected: false },
      { x: 390, y: 110, collected: false }
    ];

    // Enemies: rolling gnawty and flying necky
    this.enemies = [
      { x: 160, y: 112, vx: -25, alive: true, type: 'roller' },
      { x: 320, y: 60, vx: -35, alive: true, type: 'flyer' },
      { x: 490, y: 112, vx: -30, alive: true, type: 'roller' }
    ];

    if (lvl === 3) {
      // Boss
      this.enemies.push({ x: 580, y: 104, vx: -40, hp: 3, alive: true, type: 'boss' });
      this.exitX = 660;
    } else {
      this.exitX = 580;
    }
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

    // Swap Character (SELECT or B when not holding barrel)
    if (input.justPressed(BUTTONS.SELECT)) {
      this.char = this.char === 'DK' ? 'Diddy' : 'DK';
      this.ctx.audio.playSelect();
    }

    const moveSpeed = this.char === 'DK' ? 80 : 105;
    const jumpForce = this.char === 'DK' ? -210 : -235;

    // Horizontal Movement
    if (input.isDown(BUTTONS.LEFT)) {
      this.vx = -moveSpeed;
      this.facingRight = false;
    } else if (input.isDown(BUTTONS.RIGHT)) {
      this.vx = moveSpeed;
      this.facingRight = true;
    } else {
      this.vx = 0;
    }

    // Check Vine Climbing
    let onVine = false;
    for (const v of this.vines) {
      if (Math.abs(this.px - v.x) < 8 && this.py >= v.top && this.py <= v.bottom) {
        onVine = true;
        if (input.isDown(BUTTONS.UP)) {
          this.py -= 60 * dt;
          this.isClimbing = true;
          this.vy = 0;
        } else if (input.isDown(BUTTONS.DOWN)) {
          this.py += 60 * dt;
          this.isClimbing = true;
          this.vy = 0;
        } else if (this.isClimbing) {
          this.vy = 0;
        }
      }
    }

    if (!onVine) {
      this.isClimbing = false;
    }

    // Jump
    if (input.justPressed(BUTTONS.A) && (this.isGrounded || this.isClimbing)) {
      this.vy = jumpForce;
      this.isGrounded = false;
      this.isClimbing = false;
      this.ctx.audio.playJump();
    }

    // Gravity
    if (!this.isClimbing) {
      this.vy += 600 * dt;
    }

    this.px += this.vx * dt;
    this.py += this.vy * dt;

    // Floor (ground at y=120)
    if (this.py + 12 >= 120) {
      this.py = 108;
      this.vy = 0;
      this.isGrounded = true;
    } else if (!this.isClimbing) {
      this.isGrounded = false;
    }

    // Pickup barrel
    for (const b of this.barrels) {
      if (!b.collected && Math.hypot(this.px - b.x, this.py - b.y) < 14) {
        if (!this.hasBarrel && input.justPressed(BUTTONS.B)) {
          b.collected = true;
          this.hasBarrel = true;
          this.ctx.audio.playHit();
        }
      }
    }

    // Throw barrel (B button)
    if (this.hasBarrel && input.justPressed(BUTTONS.B)) {
      this.hasBarrel = false;
      this.thrownBarrels.push({
        x: this.px + (this.facingRight ? 12 : -12),
        y: this.py + 4,
        vx: (this.facingRight ? 1 : -1) * (this.char === 'DK' ? 160 : 130)
      });
      this.ctx.audio.playLaser();
    }

    // Update thrown barrels
    for (let i = this.thrownBarrels.length - 1; i >= 0; i--) {
      const tb = this.thrownBarrels[i];
      tb.x += tb.vx * dt;
      // Check collision with enemies
      for (const e of this.enemies) {
        if (e.alive && Math.hypot(tb.x - e.x, tb.y - e.y) < 14) {
          if (e.type === 'boss') {
            e.hp--;
            if (e.hp <= 0) e.alive = false;
          } else {
            e.alive = false;
          }
          this.score += 200;
          this.ctx.audio.playExplosion();
          this.thrownBarrels.splice(i, 1);
          break;
        }
      }
    }

    // Enemies movement & collision
    for (const e of this.enemies) {
      if (!e.alive) continue;
      e.x += e.vx * dt;
      if (e.x < 100 || e.x > 620) e.vx = -e.vx;

      if (Math.hypot(this.px - e.x, this.py - e.y) < 12) {
        this.die();
        return;
      }
    }

    // Level exit
    if (this.px >= this.exitX) {
      this.ctx.audio.playPowerup();
      if (this.level < 3) {
        this.loadLevel(this.level + 1);
      } else {
        this.gameWon = true;
        this.score += 1500;
        this.ctx.storage.setHighScore('donkeykong', this.score);
      }
    }

    // Camera follow
    const targetCam = Math.max(0, this.px - 60);
    this.cameraX += (targetCam - this.cameraX) * 0.1;
  }

  die() {
    this.lives--;
    this.ctx.audio.playGameOver();
    this.ctx.renderer.shake(4, 0.3);
    if (this.lives <= 0) {
      this.gameOver = true;
      this.ctx.storage.setHighScore('donkeykong', this.score);
    } else {
      this.loadLevel(this.level);
    }
  }

  render(r) {
    r.clear(3);
    const cx = Math.floor(this.cameraX);

    // Top HUD
    r.fillRect(0, 0, 160, 14, 1);
    r.text('DK LAND', 4, 4, 3);
    r.text(`TAG:${this.char}`, 54, 4, 3);
    r.text(`LIFE:${this.lives}`, 104, 4, 3);
    r.text(`ST:${this.level}`, 138, 4, 3);

    // Ground jungle floor
    r.fillRect(0, 120, 160, 24, 0);

    // Vines
    for (const v of this.vines) {
      const vx = Math.floor(v.x - cx);
      if (vx >= -8 && vx <= 160) {
        r.line(vx, v.top, vx, v.bottom, 1);
        r.circle(vx, v.top, 2, 0, true);
      }
    }

    // Barrels on ground
    for (const b of this.barrels) {
      if (!b.collected) {
        const bx = Math.floor(b.x - cx);
        if (bx >= -12 && bx <= 160) {
          r.fillRect(bx, b.y, 10, 10, 1);
          r.strokeRect(bx, b.y, 10, 10, 0);
          r.text('B', bx + 3, b.y + 2, 0);
        }
      }
    }

    // Thrown rolling barrels
    for (const tb of this.thrownBarrels) {
      const tbx = Math.floor(tb.x - cx);
      r.fillRect(tbx, tb.y, 8, 8, 1);
      r.strokeRect(tbx, tb.y, 8, 8, 0);
    }

    // Enemies
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const ex = Math.floor(e.x - cx);
      if (ex >= -16 && ex <= 160) {
        if (e.type === 'boss') {
          r.fillRect(ex, e.y, 18, 16, 0);
          r.text(`HP:${e.hp}`, ex, e.y - 8, 0);
        } else if (e.type === 'flyer') {
          r.fillRect(ex, e.y, 10, 6, 1);
          r.line(ex - 2, e.y + 2, ex + 12, e.y + 2, 0);
        } else {
          r.fillRect(ex, e.y, 10, 8, 1);
          r.strokeRect(ex, e.y, 10, 8, 0);
        }
      }
    }

    // Player (DK / Diddy)
    const psx = Math.floor(this.px - cx);
    const pSize = this.char === 'DK' ? 14 : 10;
    r.fillRect(psx, Math.floor(this.py), pSize, pSize, 0);
    r.fillRect(psx + (this.facingRight ? 4 : 0), Math.floor(this.py) + 2, 4, 4, 1); // tie / face

    if (this.hasBarrel) {
      r.fillRect(psx + 2, Math.floor(this.py) - 8, 8, 8, 1);
      r.strokeRect(psx + 2, Math.floor(this.py) - 8, 8, 8, 0);
    }

    // Exit Gate
    const exX = Math.floor(this.exitX - cx);
    r.strokeRect(exX, 70, 16, 50, 0);
    r.text('EXIT', exX - 2, 58, 0);

    // How to Play / Title Screen Overlay
    if (this.inTitle) {
      r.fillRect(8, 16, 144, 118, 3);
      r.strokeRect(8, 16, 144, 118, 0);
      r.strokeRect(10, 18, 140, 114, 1);

      r.textCentered('DONKEY KONG LAND', 22, 0, 1);
      r.textCentered('KONG JUNGLE ACTION', 32, 1, 1);
      r.line(16, 42, 144, 42, 1);

      r.textCentered('NOTICE: HOW TO PLAY', 46, 1, 1);
      r.text('◄ / ►: WALK | ▲ / ▼: CLIMB', 16, 58, 0);
      r.text('A / Z: JUMP OVER CREATURES', 16, 70, 0);
      r.text('B / X: PICKUP & TOSS BARREL', 16, 82, 0);
      r.text('SELECT / SHIFT: SWAP CHAR', 16, 94, 1);

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
      r.textCentered('OUT OF APE LIVES', 74, 1, 1);
      r.fillRect(28, 90, 104, 14, 0);
      r.textCentered('PRESS A TO RETRY', 94, 3, 1);
    }

    // Victory Overlay
    if (this.gameWon) {
      r.fillRect(20, 36, 120, 74, 3);
      r.strokeRect(20, 36, 120, 74, 0);
      r.strokeRect(22, 38, 116, 70, 1);
      r.textCentered('JUNGLE SAVED!', 46, 0, 1);
      r.textCentered('ALL BOSSES DEFEATED!', 62, 1, 1);
      r.textCentered(`FINAL SCORE: ${this.score}`, 76, 1, 1);
      r.fillRect(28, 90, 104, 14, 0);
      r.textCentered('PRESS A TO RESTART', 94, 3, 1);
    }

    // Pause Overlay
    if (this.paused && !this.gameOver && !this.gameWon && !this.inTitle) {
      r.fillRect(40, 58, 80, 28, 3);
      r.strokeRect(40, 58, 80, 28, 0);
      r.textCentered('PAUSED', 64, 0, 1);
      r.textCentered('START: RESUME', 74, 1, 1);
    }
  }
}
