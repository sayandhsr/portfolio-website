// The Legend of Zelda: Link's Awakening (Action-Adventure Island Quest)
import { BUTTONS } from '../InputManager.js';

export default class ZeldaGame {
  constructor() {
    this.ctx = null;
    this.hp = 6;
    this.maxHp = 6;
    this.rupees = 0;
    this.hasKey = false;
    this.hasBoomerang = true;
    this.score = 0;

    this.screenX = 0; // 0: Beach, 1: Village, 2: Dungeon
    this.px = 40;
    this.py = 60;
    this.facing = 'DOWN'; // 'UP', 'DOWN', 'LEFT', 'RIGHT'

    this.slashTimer = 0;
    this.invulnerableTimer = 0;
    this.boomerang = null;

    this.dialogue = null;
    this.gameOver = false;
    this.gameWon = false;
    this.paused = false;
    this.inTitle = true;

    this.screens = {};
  }

  init(ctx) {
    this.ctx = ctx;
    this.inTitle = true;
    this.reset(true);
  }

  reset(keepTitle = false) {
    this.hp = 6;
    this.maxHp = 6;
    this.rupees = 0;
    this.hasKey = false;
    this.score = 0;
    this.screenX = 0;
    this.px = 40;
    this.py = 60;
    this.facing = 'DOWN';
    this.slashTimer = 0;
    this.invulnerableTimer = 0;
    this.dialogue = null;
    this.gameOver = false;
    this.gameWon = false;
    if (!keepTitle) {
      this.inTitle = false;
    }

    // Build screens
    this.screens = {
      0: {
        name: 'TORONBO BEACH',
        enemies: [
          { x: 90, y: 50, vx: -20, alive: true, hp: 2, type: 'crab' },
          { x: 120, y: 90, vx: 20, alive: true, hp: 2, type: 'octorok' }
        ],
        chest: { x: 130, y: 40, opened: false, item: 'key' },
        sign: { x: 30, y: 40, text: 'EAST: MABE VILLAGE' }
      },
      1: {
        name: 'MABE VILLAGE',
        enemies: [
          { x: 80, y: 90, vx: -20, alive: true, hp: 3, type: 'moblin' }
        ],
        npc: { x: 70, y: 45, text: 'FIND THE KEY ON THE SHORE\nTO ENTER THE DUNGEON!' },
        sign: { x: 130, y: 90, text: 'NORTH: TAIL CAVE' }
      },
      2: {
        name: 'TAIL CAVE DUNGEON',
        enemies: [],
        doorLocked: true,
        boss: { x: 100, y: 65, vx: -30, hp: 10, maxHp: 10, alive: true }
      }
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

    // Dismiss Dialogue
    if (this.dialogue) {
      if (input.justPressed(BUTTONS.A) || input.justPressed(BUTTONS.B)) {
        this.dialogue = null;
        this.ctx.audio.playCursor();
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
    if (this.slashTimer > 0) this.slashTimer -= dt;

    // Movement 4-directional
    const speed = 70;
    let dx = 0;
    let dy = 0;

    if (this.slashTimer <= 0) {
      if (input.isDown(BUTTONS.UP)) { dy = -speed; this.facing = 'UP'; }
      else if (input.isDown(BUTTONS.DOWN)) { dy = speed; this.facing = 'DOWN'; }
      else if (input.isDown(BUTTONS.LEFT)) { dx = -speed; this.facing = 'LEFT'; }
      else if (input.isDown(BUTTONS.RIGHT)) { dx = speed; this.facing = 'RIGHT'; }
    }

    this.px += dx * dt;
    this.py += dy * dt;

    // Clamp inside screen bounds or transition screen
    if (this.px < 8) {
      if (this.screenX > 0) {
        this.screenX--;
        this.px = 144;
        this.ctx.audio.playCursor();
      } else {
        this.px = 8;
      }
    } else if (this.px > 146) {
      if (this.screenX < 2) {
        if (this.screenX === 1 && this.screens[2].doorLocked && !this.hasKey) {
          this.px = 146;
          this.dialogue = 'LOCKED WITH KEYHOLE!';
        } else {
          if (this.screenX === 1 && this.screens[2].doorLocked && this.hasKey) {
            this.screens[2].doorLocked = false;
            this.hasKey = false; // Tail key used to unlock Tail Cave
            this.ctx.audio.playPowerup();
          }
          this.screenX++;
          this.px = 12;
          this.ctx.audio.playCursor();
        }
      } else {
        this.px = 146;
      }
    }

    this.py = Math.max(22, Math.min(130, this.py));

    // Sword Slash (A button)
    if (input.justPressed(BUTTONS.A) && this.slashTimer <= 0) {
      this.slashTimer = 0.2;
      this.ctx.audio.playLaser();
      this.checkSwordAttack();
    }

    // Boomerang (B button)
    if (input.justPressed(BUTTONS.B) && !this.boomerang) {
      let bvx = 0, bvy = 0;
      if (this.facing === 'UP') bvy = -160;
      else if (this.facing === 'DOWN') bvy = 160;
      else if (this.facing === 'LEFT') bvx = -160;
      else bvx = 160;

      this.boomerang = { x: this.px, y: this.py, vx: bvx, vy: bvy, dist: 0 };
      this.ctx.audio.playSelect();
    }

    const curScn = this.screens[this.screenX];

    // Update Boomerang with collision detection
    if (this.boomerang) {
      this.boomerang.x += this.boomerang.vx * dt;
      this.boomerang.y += this.boomerang.vy * dt;
      this.boomerang.dist += 160 * dt;

      // Check collision with screen enemies
      if (curScn.enemies) {
        for (const e of curScn.enemies) {
          if (e.alive && Math.hypot(this.boomerang.x - e.x, this.boomerang.y - e.y) < 12) {
            e.hp--;
            this.ctx.audio.playHit();
            this.boomerang = null;
            if (e.hp <= 0) {
              e.alive = false;
              this.rupees += 5;
              this.score += 100;
              this.ctx.audio.playCoin();
            }
            break;
          }
        }
      }

      // Check collision with dungeon boss
      if (this.boomerang && this.screenX === 2 && curScn.boss && curScn.boss.alive) {
        const b = curScn.boss;
        if (Math.hypot(this.boomerang.x - b.x, this.boomerang.y - b.y) < 16) {
          b.hp--;
          this.ctx.audio.playHit();
          this.boomerang = null;
          if (b.hp <= 0) {
            b.alive = false;
            this.gameWon = true;
            this.score += 1500;
            this.ctx.audio.playPowerup();
          }
        }
      }

      if (this.boomerang && this.boomerang.dist > 75) {
        this.boomerang = null;
      }
    }

    // Check Chest & Signs & NPC
    if (curScn.chest && !curScn.chest.opened) {
      if (Math.hypot(this.px - curScn.chest.x, this.py - curScn.chest.y) < 14) {
        curScn.chest.opened = true;
        this.hasKey = true;
        this.ctx.audio.playPowerup();
        this.dialogue = 'YOU FOUND THE TAIL KEY!';
      }
    }

    if (curScn.sign && Math.hypot(this.px - curScn.sign.x, this.py - curScn.sign.y) < 14) {
      if (input.justPressed(BUTTONS.A)) {
        this.dialogue = curScn.sign.text;
      }
    }

    if (curScn.npc && Math.hypot(this.px - curScn.npc.x, this.py - curScn.npc.y) < 16) {
      if (input.justPressed(BUTTONS.A)) {
        this.dialogue = curScn.npc.text;
      }
    }

    // Enemies in current screen
    if (curScn.enemies) {
      for (const e of curScn.enemies) {
        if (!e.alive) continue;
        e.x += e.vx * dt;
        if (e.x < 30 || e.x > 130) e.vx = -e.vx;

        if (this.invulnerableTimer <= 0 && Math.hypot(this.px - e.x, this.py - e.y) < 10) {
          this.takeDamage(1);
        }
      }
    }

    // Boss in dungeon screen
    if (this.screenX === 2 && curScn.boss && curScn.boss.alive) {
      const b = curScn.boss;
      b.x += b.vx * dt;
      if (b.x < 40 || b.x > 120) b.vx = -b.vx;

      if (this.invulnerableTimer <= 0 && Math.hypot(this.px - b.x, this.py - b.y) < 14) {
        this.takeDamage(2);
      }
    }
  }

  checkSwordAttack() {
    const curScn = this.screens[this.screenX];
    let hx = this.px;
    let hy = this.py;
    if (this.facing === 'UP') hy -= 12;
    else if (this.facing === 'DOWN') hy += 12;
    else if (this.facing === 'LEFT') hx -= 12;
    else hx += 12;

    if (curScn.enemies) {
      for (const e of curScn.enemies) {
        if (e.alive && Math.hypot(hx - e.x, hy - e.y) < 14) {
          e.hp--;
          this.ctx.audio.playHit();
          if (e.hp <= 0) {
            e.alive = false;
            this.rupees += 5;
            this.score += 100;
            this.ctx.audio.playCoin();
          }
        }
      }
    }

    if (this.screenX === 2 && curScn.boss && curScn.boss.alive) {
      if (Math.hypot(hx - curScn.boss.x, hy - curScn.boss.y) < 18) {
        curScn.boss.hp -= 2;
        this.ctx.audio.playHit();
        if (curScn.boss.hp <= 0) {
          curScn.boss.alive = false;
          this.gameWon = true;
          this.score += 2500;
          this.ctx.audio.playPowerup();
          this.ctx.storage.setHighScore('zelda', this.score);
        }
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
      this.ctx.storage.setHighScore('zelda', this.score);
    }
  }

  render(r) {
    r.clear(3);

    // Top HUD
    r.fillRect(0, 0, 160, 14, 1);
    r.text(`ZELDA`, 4, 4, 3);
    r.text(`♥${this.hp}/${this.maxHp}`, 46, 4, 3);
    r.text(`$${this.rupees}`, 90, 4, 3);
    r.text(`KEY:${this.hasKey ? 'YES' : 'NO'}`, 116, 4, 3);

    const curScn = this.screens[this.screenX];

    // Environment details
    r.text(curScn.name, 4, 18, 2);

    if (this.screenX === 0) {
      // Beach sand dunes & water waves
      r.line(0, 125, 160, 125, 2);
      r.text('~ ~ ~ ~ ~ ~', 20, 130, 1);
    } else if (this.screenX === 1) {
      // Village house
      r.fillRect(90, 30, 40, 30, 1);
      r.strokeRect(90, 30, 40, 30, 0);
      r.fillRect(105, 45, 10, 15, 0); // door
    } else {
      // Dungeon stone room
      r.strokeRect(10, 25, 140, 110, 0);
    }

    // Chest
    if (curScn.chest) {
      r.fillRect(curScn.chest.x, curScn.chest.y, 10, 8, curScn.chest.opened ? 2 : 1);
      r.strokeRect(curScn.chest.x, curScn.chest.y, 10, 8, 0);
    }

    // NPC
    if (curScn.npc) {
      r.fillRect(curScn.npc.x, curScn.npc.y, 8, 12, 1);
      r.circle(curScn.npc.x + 4, curScn.npc.y + 2, 2, 0, true);
    }

    // Enemies
    if (curScn.enemies) {
      for (const e of curScn.enemies) {
        if (!e.alive) continue;
        r.fillRect(e.x, e.y, 8, 8, 0);
        r.circle(e.x + 4, e.y + 4, 1, 3, true);
      }
    }

    // Boss
    if (this.screenX === 2 && curScn.boss && curScn.boss.alive) {
      const b = curScn.boss;
      r.circle(b.x, b.y, 12, 0, true);
      r.circle(b.x - 4, b.y - 2, 2, 3, true);
      r.circle(b.x + 4, b.y - 2, 2, 3, true);
      r.text(`BOSS:${b.hp}`, b.x - 14, b.y - 18, 0);
    }

    // Boomerang
    if (this.boomerang) {
      r.fillRect(this.boomerang.x, this.boomerang.y, 4, 4, 0);
    }

    // Player (Link with sword and shield)
    if (this.invulnerableTimer <= 0 || Math.floor(Date.now() / 80) % 2 === 0) {
      r.fillRect(this.px, this.py, 8, 12, 0);
      r.fillRect(this.px + 2, this.py + 2, 4, 3, 1); // cap/face

      // Sword slash
      if (this.slashTimer > 0) {
        let sx1 = this.px + 4, sy1 = this.py + 4;
        let sx2 = sx1, sy2 = sy1;
        if (this.facing === 'UP') sy2 -= 14;
        else if (this.facing === 'DOWN') sy2 += 14;
        else if (this.facing === 'LEFT') sx2 -= 14;
        else sx2 += 14;
        r.line(sx1, sy1, sx2, sy2, 0);
      }
    }

    // Dialogue Box Overlay
    if (this.dialogue) {
      r.fillRect(10, 85, 140, 50, 3);
      r.strokeRect(10, 85, 140, 50, 0);
      r.text(this.dialogue, 15, 95, 0);
      r.text('▼', 138, 124, 0);
    }

    // How to Play / Title Screen Overlay
    if (this.inTitle) {
      r.fillRect(8, 16, 144, 118, 3);
      r.strokeRect(8, 16, 144, 118, 0);
      r.strokeRect(10, 18, 140, 114, 1);

      r.textCentered('THE LEGEND OF ZELDA', 22, 0, 1);
      r.textCentered("LINK'S AWAKENING", 32, 1, 1);
      r.line(16, 42, 144, 42, 1);

      r.textCentered('NOTICE: HOW TO PLAY', 46, 1, 1);
      r.text('ARROWS/WASD: MOVE LINK', 16, 58, 0);
      r.text('A / Z: SWORD SLASH / TALK', 16, 70, 0);
      r.text('B / X: THROW BOOMERANG', 16, 82, 0);
      r.text('FIND TAIL KEY ON BEACH', 16, 94, 1);

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
      r.textCentered('KOHOLINT FORGIVES YOU', 74, 1, 1);
      r.fillRect(28, 90, 104, 14, 0);
      r.textCentered('PRESS A TO RETRY', 94, 3, 1);
    }

    // Victory Overlay
    if (this.gameWon) {
      r.fillRect(20, 36, 120, 74, 3);
      r.strokeRect(20, 36, 120, 74, 0);
      r.strokeRect(22, 38, 116, 70, 1);
      r.textCentered('INSTRUMENT AWAKENED', 46, 0, 1);
      r.textCentered('TAIL CAVE CLEARED!', 62, 1, 1);
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
