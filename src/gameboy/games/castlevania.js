// Castlevania: Rondo of Blood (Gothic Action Platformer)
import { BUTTONS } from '../InputManager.js';

export default class CastlevaniaGame {
  constructor() {
    this.ctx = null;
    this.score = 0;
    this.hearts = 10;
    this.hp = 16;
    this.stage = 1;
    this.gameOver = false;
    this.gameWon = false;
    this.paused = false;
    this.inTitle = true;

    this.px = 24;
    this.py = 104;
    this.vx = 0;
    this.vy = 0;
    this.isGrounded = false;
    this.facingRight = true;
    this.whipTimer = 0;
    this.invulnerableTimer = 0;

    this.cameraX = 0;
    this.candles = [];
    this.subWeapons = [];
    this.enemies = [];
    this.boss = null;
  }

  init(ctx) {
    this.ctx = ctx;
    this.inTitle = true;
    this.reset(true);
  }

  reset(keepTitle = false) {
    this.score = 0;
    this.hearts = 10;
    this.hp = 16;
    this.stage = 1;
    this.gameOver = false;
    this.gameWon = false;
    if (!keepTitle) {
      this.inTitle = false;
    }
    this.loadStage(1);
  }

  loadStage(stg) {
    this.stage = stg;
    this.px = 24;
    this.py = 104;
    this.vx = 0;
    this.vy = 0;
    this.cameraX = 0;
    this.subWeapons = [];
    this.whipTimer = 0;

    // Candles
    this.candles = [
      { x: 70, y: 80, lit: true },
      { x: 150, y: 70, lit: true },
      { x: 250, y: 80, lit: true },
      { x: 380, y: 70, lit: true },
      { x: 480, y: 80, lit: true }
    ];

    // Stage enemies
    this.enemies = [
      { x: 120, y: 104, vx: -20, alive: true, hp: 2, type: 'ghoul' },
      { x: 220, y: 80, vx: -30, alive: true, hp: 1, type: 'bat' },
      { x: 340, y: 104, vx: -25, alive: true, hp: 3, type: 'skeleton' }
    ];

    // Stage Boss
    const bossNames = ['GIANT BAT', 'DARK KNIGHT', 'COUNT DRACULA'];
    this.boss = {
      name: bossNames[stg - 1],
      x: 540,
      y: 90,
      vx: -25,
      hp: 12 + stg * 4,
      maxHp: 12 + stg * 4,
      alive: true
    };
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

    if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;
    if (this.whipTimer > 0) this.whipTimer -= dt;

    // Movement (deliberate classic speed)
    if (this.whipTimer <= 0) {
      if (input.isDown(BUTTONS.LEFT)) {
        this.vx = -70;
        this.facingRight = false;
      } else if (input.isDown(BUTTONS.RIGHT)) {
        this.vx = 70;
        this.facingRight = true;
      } else {
        this.vx = 0;
      }
    } else {
      this.vx = 0;
    }

    // Jump
    if (input.justPressed(BUTTONS.A) && this.isGrounded && this.whipTimer <= 0) {
      this.vy = -200;
      this.isGrounded = false;
      this.ctx.audio.playJump();
    }

    // Attack controls
    if (input.isDown(BUTTONS.UP) && input.justPressed(BUTTONS.B)) {
      // Sub-weapon throwing (Up + B)
      if (this.hearts > 0) {
        this.hearts--;
        this.subWeapons.push({
          x: this.px + (this.facingRight ? 10 : -10),
          y: this.py + 4,
          vx: (this.facingRight ? 1 : -1) * 150
        });
        this.ctx.audio.playSelect();
      }
    } else if (input.justPressed(BUTTONS.B) && this.whipTimer <= 0) {
      // Whip Attack (B button)
      this.whipTimer = 0.25;
      this.ctx.audio.playLaser();
      this.checkWhipCollision();
    }

    // Gravity
    this.vy += 650 * dt;
    this.px += this.vx * dt;
    this.py += this.vy * dt;

    // Floor at y=120
    if (this.py + 16 >= 120) {
      this.py = 104;
      this.vy = 0;
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
    }

    // Update subweapons
    for (let i = this.subWeapons.length - 1; i >= 0; i--) {
      const sw = this.subWeapons[i];
      sw.x += sw.vx * dt;
      // Hit enemies or boss
      for (const e of this.enemies) {
        if (e.alive && Math.hypot(sw.x - e.x, sw.y - e.y) < 14) {
          e.hp -= 2;
          if (e.hp <= 0) e.alive = false;
          this.subWeapons.splice(i, 1);
          this.ctx.audio.playHit();
          break;
        }
      }
      if (this.boss && this.boss.alive && Math.hypot(sw.x - this.boss.x, sw.y - this.boss.y) < 18) {
        this.boss.hp -= 2;
        if (this.boss.hp <= 0) this.onBossDefeated();
        this.subWeapons.splice(i, 1);
        this.ctx.audio.playExplosion();
      }
    }

    // Enemies movement & collision
    for (const e of this.enemies) {
      if (!e.alive) continue;
      e.x += e.vx * dt;
      if (e.x < 80 || e.x > 500) e.vx = -e.vx;

      if (this.invulnerableTimer <= 0 && Math.hypot(this.px - e.x, this.py - e.y) < 12) {
        this.takeDamage(2);
      }
    }

    // Boss movement & collision
    if (this.boss && this.boss.alive) {
      this.boss.x += this.boss.vx * dt;
      if (this.boss.x < 460 || this.boss.x > 580) this.boss.vx = -this.boss.vx;
      if (this.invulnerableTimer <= 0 && Math.hypot(this.px - this.boss.x, this.py - this.boss.y) < 16) {
        this.takeDamage(3);
      }
    }

    // Camera follow
    const targetCam = Math.max(0, this.px - 60);
    this.cameraX += (targetCam - this.cameraX) * 0.1;
  }

  checkWhipCollision() {
    const whipReach = 24;
    const whipX = this.facingRight ? this.px + 8 : this.px - whipReach;

    // Hit candles
    for (const c of this.candles) {
      if (c.lit && c.x >= whipX && c.x <= whipX + whipReach && Math.abs(c.y - (this.py + 6)) < 16) {
        c.lit = false;
        this.hearts += 2;
        this.score += 100;
        this.ctx.audio.playCoin();
      }
    }

    // Hit enemies
    for (const e of this.enemies) {
      if (e.alive && e.x >= whipX && e.x <= whipX + whipReach && Math.abs(e.y - this.py) < 16) {
        e.hp -= 2;
        if (e.hp <= 0) e.alive = false;
        this.score += 150;
        this.ctx.audio.playHit();
      }
    }

    // Hit boss
    if (this.boss && this.boss.alive && this.boss.x >= whipX && this.boss.x <= whipX + whipReach) {
      this.boss.hp -= 2;
      this.ctx.audio.playHit();
      if (this.boss.hp <= 0) {
        this.onBossDefeated();
      }
    }
  }

  takeDamage(amount) {
    this.hp -= amount;
    this.invulnerableTimer = 1.0;
    this.ctx.audio.playHit();
    this.ctx.renderer.shake(3, 0.2);
    if (this.hp <= 0) {
      this.gameOver = true;
      this.ctx.audio.playGameOver();
      this.ctx.storage.setHighScore('castlevania', this.score);
    }
  }

  onBossDefeated() {
    this.boss.alive = false;
    this.score += 1000 * this.stage;
    this.ctx.audio.playPowerup();
    if (this.stage < 3) {
      this.loadStage(this.stage + 1);
    } else {
      this.gameWon = true;
      this.ctx.storage.setHighScore('castlevania', this.score);
    }
  }

  render(r) {
    r.clear(3);
    const cx = Math.floor(this.cameraX);

    // Top HUD
    r.fillRect(0, 0, 160, 14, 1);
    r.text(`STAGE ${this.stage}`, 4, 4, 3);
    r.text(`HP:${this.hp}`, 50, 4, 3);
    r.text(`♥:${this.hearts}`, 92, 4, 3);
    r.text(`BOSS:${this.boss && this.boss.alive ? this.boss.hp : 0}`, 120, 4, 3);

    // Gothic castle brick floor
    r.fillRect(0, 120, 160, 24, 0);

    // Candles
    for (const c of this.candles) {
      const kx = Math.floor(c.x - cx);
      if (kx >= -10 && kx <= 160) {
        r.fillRect(kx, c.y, 4, 8, 1);
        if (c.lit) {
          r.circle(kx + 2, c.y - 2, 2, 0, true);
        }
      }
    }

    // Enemies
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const ex = Math.floor(e.x - cx);
      if (ex >= -16 && ex <= 160) {
        r.fillRect(ex, e.y, 10, 12, 1);
        r.strokeRect(ex, e.y, 10, 12, 0);
      }
    }

    // Subweapons (daggers/crosses)
    for (const sw of this.subWeapons) {
      const swx = Math.floor(sw.x - cx);
      r.fillRect(swx, sw.y, 6, 2, 0);
    }

    // Boss
    if (this.boss && this.boss.alive) {
      const bx = Math.floor(this.boss.x - cx);
      if (bx >= -24 && bx <= 160) {
        r.fillRect(bx, this.boss.y, 16, 20, 0);
        r.fillRect(bx + 4, this.boss.y + 4, 8, 4, 1);
      }
    }

    // Player (Simon)
    const px = Math.floor(this.px - cx);
    if (this.invulnerableTimer <= 0 || Math.floor(Date.now() / 80) % 2 === 0) {
      r.fillRect(px, Math.floor(this.py), 8, 16, 0);
      r.fillRect(px + (this.facingRight ? 4 : 0), Math.floor(this.py) + 2, 4, 4, 1);

      // Whip swing - properly drawn in both facing directions
      if (this.whipTimer > 0) {
        const whipY = Math.floor(this.py) + 6;
        if (this.facingRight) {
          r.line(px + 8, whipY, px + 26, whipY, 0);
          r.fillRect(px + 8, whipY - 1, 18, 2, 1);
        } else {
          r.line(px - 18, whipY, px, whipY, 0);
          r.fillRect(px - 18, whipY - 1, 18, 2, 1);
        }
      }
    }

    // How to Play / Title Screen Overlay
    if (this.inTitle) {
      r.fillRect(8, 16, 144, 118, 3);
      r.strokeRect(8, 16, 144, 118, 0);
      r.strokeRect(10, 18, 140, 114, 1);

      r.textCentered('CASTLEVANIA', 22, 0, 1);
      r.textCentered('RONDO OF BLOOD', 32, 1, 1);
      r.line(16, 42, 144, 42, 1);

      r.textCentered('NOTICE: HOW TO PLAY', 46, 1, 1);
      r.text('◄ / ►: WALK GOTHIC HALLS', 16, 58, 0);
      r.text('A / Z: JUMP OVER CREATURES', 16, 70, 0);
      r.text('B / X: WHIP STRIKE', 16, 82, 0);
      r.text('▲ + B: SUB-WEAPON (HEARTS)', 16, 94, 1);

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
      r.textCentered('THE CASTLE PERSISTS', 74, 1, 1);
      r.fillRect(28, 90, 104, 14, 0);
      r.textCentered('PRESS A TO RETRY', 94, 3, 1);
    }

    // Victory Overlay
    if (this.gameWon) {
      r.fillRect(20, 36, 120, 74, 3);
      r.strokeRect(20, 36, 120, 74, 0);
      r.strokeRect(22, 38, 116, 70, 1);
      r.textCentered('DRACULA SLAIN!', 46, 0, 1);
      r.textCentered('CASTLE DESTROYED!', 62, 1, 1);
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
