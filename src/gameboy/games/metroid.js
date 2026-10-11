// Metroid II: Return of Samus (Action Cavern Exploration)
import { BUTTONS } from '../InputManager.js';

export default class MetroidGame {
  constructor() {
    this.ctx = null;
    this.energy = 99;
    this.maxEnergy = 99;
    this.missiles = 10;
    this.maxMissiles = 10;
    this.metroidsLeft = 4;
    this.score = 0;
    this.hasHighJump = false;
    this.weapon = 'beam'; // 'beam' or 'missile'
    this.gameOver = false;
    this.gameWon = false;
    this.paused = false;
    this.inTitle = true;

    this.px = 24;
    this.py = 100;
    this.vx = 0;
    this.vy = 0;
    this.isGrounded = false;
    this.facingRight = true;
    this.aimingUp = false;
    this.invulnerableTimer = 0;

    this.cameraX = 0;
    this.shots = [];
    this.enemies = [];
    this.pickups = [];
  }

  init(ctx) {
    this.ctx = ctx;
    this.reset();
  }

  reset() {
    this.energy = 99;
    this.missiles = 10;
    this.metroidsLeft = 4;
    this.score = 0;
    this.hasHighJump = false;
    this.weapon = 'beam';
    this.gameOver = false;
    this.gameWon = false;
    this.inTitle = false;

    this.px = 24;
    this.py = 100;
    this.vx = 0;
    this.vy = 0;
    this.cameraX = 0;
    this.shots = [];

    // High jump item upgrade located on high ledge at x=340, y=50
    this.pickups = [
      { x: 340, y: 56, type: 'highjump', collected: false },
      { x: 180, y: 110, type: 'energy', collected: false },
      { x: 420, y: 110, type: 'missile', collected: false }
    ];

    // Metroid creatures & cavern enemies
    this.enemies = [
      { x: 140, y: 110, vx: -20, alive: true, hp: 3, type: 'crawler' },
      { x: 260, y: 70, vx: -30, alive: true, hp: 5, type: 'metroid' },
      { x: 450, y: 65, vx: -35, alive: true, hp: 6, type: 'metroid' },
      { x: 560, y: 80, vx: -25, alive: true, hp: 8, type: 'metroid' },
      { x: 680, y: 85, vx: -30, alive: true, hp: 12, type: 'metroid_queen' }
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

    if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;

    // Toggle Weapon (SELECT)
    if (input.justPressed(BUTTONS.SELECT)) {
      this.weapon = this.weapon === 'beam' ? 'missile' : 'beam';
      this.ctx.audio.playSelect();
    }

    // Aiming Up
    this.aimingUp = input.isDown(BUTTONS.UP);

    // Movement
    if (input.isDown(BUTTONS.LEFT)) {
      this.vx = -85;
      this.facingRight = false;
    } else if (input.isDown(BUTTONS.RIGHT)) {
      this.vx = 85;
      this.facingRight = true;
    } else {
      this.vx = 0;
    }

    // Jump (Z or A button)
    const jumpForce = this.hasHighJump ? -245 : -195;
    if (input.justPressed(BUTTONS.A) && this.isGrounded) {
      this.vy = jumpForce;
      this.isGrounded = false;
      this.ctx.audio.playJump();
    }

    // Fire Arm-Cannon (X or B button)
    if (input.justPressed(BUTTONS.B)) {
      if (this.weapon === 'missile') {
        if (this.missiles > 0) {
          this.missiles--;
          this.fireShot(true);
        } else {
          this.ctx.audio.playHit();
        }
      } else {
        this.fireShot(false);
      }
    }

    // Gravity
    this.vy += 600 * dt;
    this.px += this.vx * dt;
    this.py += this.vy * dt;

    // Floor at y=120
    if (this.py + 14 >= 120) {
      this.py = 106;
      this.vy = 0;
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
    }

    // Update Projectiles
    for (let i = this.shots.length - 1; i >= 0; i--) {
      const s = this.shots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;

      // Hit enemies
      for (const e of this.enemies) {
        if (e.alive && Math.hypot(s.x - e.x, s.y - e.y) < 14) {
          const dmg = s.isMissile ? 5 : 1;
          e.hp -= dmg;
          this.ctx.audio.playHit();
          this.shots.splice(i, 1);

          if (e.hp <= 0) {
            e.alive = false;
            this.ctx.audio.playExplosion();
            this.score += s.isMissile ? 300 : 150;
            if (e.type.includes('metroid')) {
              this.metroidsLeft = Math.max(0, this.metroidsLeft - 1);
              if (this.metroidsLeft === 0) {
                this.gameWon = true;
                this.score += 2000;
                this.ctx.storage.setHighScore('metroid', this.score);
              }
            }
          }
          break;
        }
      }
    }

    // Pickups
    for (const p of this.pickups) {
      if (!p.collected && Math.hypot(this.px - p.x, this.py - p.y) < 14) {
        p.collected = true;
        this.ctx.audio.playPowerup();
        if (p.type === 'highjump') {
          this.hasHighJump = true;
          this.score += 500;
        } else if (p.type === 'energy') {
          this.energy = Math.min(this.maxEnergy, this.energy + 30);
        } else if (p.type === 'missile') {
          this.missiles = Math.min(this.maxMissiles, this.missiles + 5);
        }
      }
    }

    // Enemies collision
    for (const e of this.enemies) {
      if (!e.alive) continue;
      e.x += e.vx * dt;
      if (e.x < 100 || e.x > 720) e.vx = -e.vx;

      if (this.invulnerableTimer <= 0 && Math.hypot(this.px - e.x, this.py - e.y) < 12) {
        this.energy -= 15;
        this.invulnerableTimer = 1.0;
        this.ctx.audio.playHit();
        this.ctx.renderer.shake(3, 0.2);
        if (this.energy <= 0) {
          this.gameOver = true;
          this.ctx.audio.playGameOver();
          this.ctx.storage.setHighScore('metroid', this.score);
        }
      }
    }

    // Camera
    const targetCam = Math.max(0, this.px - 60);
    this.cameraX += (targetCam - this.cameraX) * 0.1;
  }

  fireShot(isMissile) {
    let svx = 0;
    let svy = 0;
    if (this.aimingUp) {
      svy = -220;
    } else {
      svx = (this.facingRight ? 1 : -1) * 220;
    }

    this.shots.push({
      x: this.px + (this.facingRight ? 8 : -2),
      y: this.aimingUp ? this.py - 4 : this.py + 4,
      vx: svx,
      vy: svy,
      isMissile
    });

    if (isMissile) this.ctx.audio.playLaser();
    else this.ctx.audio.playSelect();
  }

  render(r) {
    r.clear(3);
    const cx = Math.floor(this.cameraX);

    // Top HUD
    r.fillRect(0, 0, 160, 14, 1);
    r.text(`EN:${this.energy}`, 4, 4, 3);
    r.text(`M:${this.missiles}`, 54, 4, 3);
    r.text(`LEFT:${this.metroidsLeft}`, 92, 4, 3);
    r.text(`${this.weapon.toUpperCase()}`, 135, 4, 3);

    // Cavern rocky floor
    r.fillRect(0, 120, 160, 24, 0);

    // High ledge at x=320..380
    const lx = Math.floor(320 - cx);
    if (lx >= -60 && lx <= 160) {
      r.fillRect(lx, 70, 60, 8, 1);
      r.strokeRect(lx, 70, 60, 8, 0);
    }

    // Pickups
    for (const p of this.pickups) {
      if (!p.collected) {
        const px = Math.floor(p.x - cx);
        if (px >= -12 && px <= 160) {
          r.circle(px, p.y, 4, 1, true);
          r.strokeRect(px - 3, p.y - 3, 6, 6, 0);
        }
      }
    }

    // Projectiles
    for (const s of this.shots) {
      const sx = Math.floor(s.x - cx);
      if (s.isMissile) {
        r.fillRect(sx, s.y, 4, 2, 0);
      } else {
        r.circle(sx, s.y, 2, 0, true);
      }
    }

    // Enemies
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const ex = Math.floor(e.x - cx);
      if (ex >= -20 && ex <= 160) {
        if (e.type.includes('metroid')) {
          // Floating jelly organism
          r.circle(ex, e.y, 8, 1, true);
          r.strokeRect(ex - 6, e.y - 6, 12, 12, 0);
          r.circle(ex - 2, e.y - 2, 2, 0, true);
          r.circle(ex + 2, e.y - 2, 2, 0, true);
        } else {
          // Cavern crawler
          r.fillRect(ex, e.y, 10, 6, 0);
        }
      }
    }

    // Player (Samus power suit)
    const psx = Math.floor(this.px - cx);
    if (this.invulnerableTimer <= 0 || Math.floor(Date.now() / 80) % 2 === 0) {
      r.fillRect(psx, Math.floor(this.py), 8, 14, 0);
      r.fillRect(psx + (this.facingRight ? 2 : 0), Math.floor(this.py) + 2, 5, 4, 1); // visor
      // Arm cannon
      if (this.aimingUp) {
        r.fillRect(psx + 2, Math.floor(this.py) - 4, 3, 5, 0);
      } else {
        r.fillRect(psx + (this.facingRight ? 8 : -3), Math.floor(this.py) + 4, 4, 3, 0);
      }
    }

    // Title Overlay
    if (this.inTitle) {
      r.fillRect(15, 30, 130, 85, 3);
      r.strokeRect(15, 30, 130, 85, 0);
      r.textCentered('METROID II', 40, 0, 1);
      r.textCentered('RETURN OF SAMUS', 52, 1, 1);
      r.textCentered('PRESS A OR START', 76, 0, 1);
      r.textCentered('SELECT: MISSILES', 94, 1, 1);
    }

    // Game Over Overlay
    if (this.gameOver) {
      r.fillRect(25, 40, 110, 68, 3);
      r.strokeRect(25, 40, 110, 68, 0);
      r.textCentered('SUIT COMPROMISED', 52, 0, 1);
      r.textCentered(`SCORE: ${this.score}`, 68, 1, 1);
      r.textCentered('PRESS A TO RETRY', 85, 0, 1);
    }

    // Victory Overlay
    if (this.gameWon) {
      r.fillRect(20, 35, 120, 75, 3);
      r.strokeRect(20, 35, 120, 75, 0);
      r.textCentered('MISSION COMPLETE', 48, 0, 1);
      r.textCentered('SR388 SECURED', 64, 1, 1);
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
