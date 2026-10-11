// Final Fantasy Adventure (Action-RPG with Real-time Combat, Stats & Inventory)
import { BUTTONS } from '../InputManager.js';

export default class FinalFantasyGame {
  constructor() {
    this.ctx = null;
    this.hp = 20;
    this.maxHp = 20;
    this.mp = 10;
    this.maxMp = 10;
    this.exp = 0;
    this.level = 1;
    this.gold = 50;
    this.potions = 2;
    this.score = 0;

    // Location: 'TOWN', 'OVERWORLD', 'CAVE'
    this.location = 'TOWN';

    this.px = 40;
    this.py = 60;
    this.facing = 'DOWN';
    this.attackTimer = 0;
    this.invulnerableTimer = 0;

    this.dialogue = null;
    this.gameOver = false;
    this.gameWon = false;
    this.paused = false;
    this.inTitle = true;

    this.enemies = [];
    this.boss = null;
  }

  init(ctx) {
    this.ctx = ctx;
    this.loadGame();
  }

  loadGame() {
    const saved = this.ctx.storage.getSaveSlot('finalfantasy', 0);
    if (saved) {
      this.hp = saved.hp || 20;
      this.maxHp = saved.maxHp || 20;
      this.level = saved.level || 1;
      this.exp = saved.exp || 0;
      this.gold = saved.gold || 50;
      this.potions = saved.potions || 2;
    }
    this.reset();
  }

  saveGame() {
    this.ctx.storage.writeSaveSlot('finalfantasy', 0, {
      hp: this.hp,
      maxHp: this.maxHp,
      level: this.level,
      exp: this.exp,
      gold: this.gold,
      potions: this.potions
    });
    this.ctx.audio.playSelect();
  }

  reset() {
    this.location = 'TOWN';
    this.px = 40;
    this.py = 60;
    this.facing = 'DOWN';
    this.attackTimer = 0;
    this.invulnerableTimer = 0;
    this.dialogue = null;
    this.gameOver = false;
    this.gameWon = false;
    this.inTitle = false;
    this.loadLocation('TOWN');
  }

  loadLocation(loc) {
    this.location = loc;
    this.attackTimer = 0;

    if (loc === 'TOWN') {
      this.enemies = [];
      this.boss = null;
    } else if (loc === 'OVERWORLD') {
      this.enemies = [
        { x: 50, y: 50, vx: -20, alive: true, hp: 4, type: 'slime' },
        { x: 110, y: 80, vx: 20, alive: true, hp: 6, type: 'goblin' }
      ];
      this.boss = null;
    } else if (loc === 'CAVE') {
      this.enemies = [
        { x: 60, y: 80, vx: -25, alive: true, hp: 8, type: 'skeleton' }
      ];
      this.boss = {
        name: 'SHADOW DRAGON',
        x: 100,
        y: 60,
        vx: -30,
        hp: 25,
        maxHp: 25,
        alive: true
      };
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
    if (this.attackTimer > 0) this.attackTimer -= dt;

    // Movement
    const speed = 75;
    let dx = 0, dy = 0;
    if (this.attackTimer <= 0) {
      if (input.isDown(BUTTONS.UP)) { dy = -speed; this.facing = 'UP'; }
      else if (input.isDown(BUTTONS.DOWN)) { dy = speed; this.facing = 'DOWN'; }
      else if (input.isDown(BUTTONS.LEFT)) { dx = -speed; this.facing = 'LEFT'; }
      else if (input.isDown(BUTTONS.RIGHT)) { dx = speed; this.facing = 'RIGHT'; }
    }

    this.px += dx * dt;
    this.py += dy * dt;

    // Boundary transitions between locations
    if (this.location === 'TOWN') {
      if (this.px > 146) {
        this.px = 12;
        this.loadLocation('OVERWORLD');
        this.ctx.audio.playCursor();
      }
    } else if (this.location === 'OVERWORLD') {
      if (this.px < 8) {
        this.px = 140;
        this.loadLocation('TOWN');
        this.ctx.audio.playCursor();
      } else if (this.px > 146) {
        this.px = 12;
        this.loadLocation('CAVE');
        this.ctx.audio.playCursor();
      }
    } else if (this.location === 'CAVE') {
      if (this.px < 8) {
        this.px = 140;
        this.loadLocation('OVERWORLD');
        this.ctx.audio.playCursor();
      }
    }

    this.px = Math.max(8, Math.min(146, this.px));
    this.py = Math.max(22, Math.min(130, this.py));

    // Sword Attack (A button)
    if (input.justPressed(BUTTONS.A) && this.attackTimer <= 0) {
      this.attackTimer = 0.22;
      this.ctx.audio.playLaser();
      this.checkSwordAttack();
    }

    // Potion Use (B button)
    if (input.justPressed(BUTTONS.B)) {
      if (this.potions > 0 && this.hp < this.maxHp) {
        this.potions--;
        this.hp = Math.min(this.maxHp, this.hp + 12);
        this.ctx.audio.playPowerup();
        this.dialogue = 'USED POTION! RECOVERED HP.';
      } else if (this.potions === 0) {
        this.dialogue = 'NO POTIONS LEFT!';
      }
    }

    // Town NPCs & Shop
    if (this.location === 'TOWN') {
      // Quest Giver at x=30, y=40
      if (Math.hypot(this.px - 30, this.py - 40) < 16 && input.justPressed(BUTTONS.A)) {
        this.dialogue = 'QUEST GIVER:\nSLAY THE DRAGON IN THE CAVE!\nPROCEED EAST TO EXPLORE.';
        this.saveGame();
      }
      // Shopkeeper at x=110, y=40
      if (Math.hypot(this.px - 110, this.py - 40) < 16 && input.justPressed(BUTTONS.A)) {
        if (this.gold >= 20) {
          this.gold -= 20;
          this.potions++;
          this.ctx.audio.playCoin();
          this.dialogue = 'SHOP:\nBOUGHT 1 POTION FOR 20G!';
          this.saveGame();
        } else {
          this.dialogue = 'SHOP:\nPOTIONS COST 20G. NOT ENOUGH GOLD!';
        }
      }
    }

    // Enemies in Overworld / Cave
    for (const e of this.enemies) {
      if (!e.alive) continue;
      e.x += e.vx * dt;
      if (e.x < 25 || e.x > 135) e.vx = -e.vx;

      if (this.invulnerableTimer <= 0 && Math.hypot(this.px - e.x, this.py - e.y) < 10) {
        this.takeDamage(2);
      }
    }

    // Boss in Cave
    if (this.boss && this.boss.alive) {
      this.boss.x += this.boss.vx * dt;
      if (this.boss.x < 40 || this.boss.x > 120) this.boss.vx = -this.boss.vx;

      if (this.invulnerableTimer <= 0 && Math.hypot(this.px - this.boss.x, this.py - this.boss.y) < 14) {
        this.takeDamage(4);
      }
    }
  }

  checkSwordAttack() {
    let hx = this.px, hy = this.py;
    if (this.facing === 'UP') hy -= 12;
    else if (this.facing === 'DOWN') hy += 12;
    else if (this.facing === 'LEFT') hx -= 12;
    else hx += 12;

    const atkPower = 2 + this.level;

    for (const e of this.enemies) {
      if (e.alive && Math.hypot(hx - e.x, hy - e.y) < 14) {
        e.hp -= atkPower;
        this.ctx.audio.playHit();
        if (e.hp <= 0) {
          e.alive = false;
          this.gold += 15;
          this.exp += 20;
          this.score += 150;
          this.ctx.audio.playCoin();
          this.checkLevelUp();
        }
      }
    }

    if (this.boss && this.boss.alive && Math.hypot(hx - this.boss.x, hy - this.boss.y) < 18) {
      this.boss.hp -= atkPower;
      this.ctx.audio.playHit();
      if (this.boss.hp <= 0) {
        this.boss.alive = false;
        this.gameWon = true;
        this.score += 3000;
        this.ctx.audio.playPowerup();
        this.ctx.storage.setHighScore('finalfantasy', this.score);
      }
    }
  }

  checkLevelUp() {
    if (this.exp >= this.level * 40) {
      this.level++;
      this.maxHp += 6;
      this.hp = this.maxHp;
      this.ctx.audio.playPowerup();
      this.dialogue = `LEVEL UP! REACHED LV ${this.level}!\nHP RESTORED AND INCREASED.`;
      this.saveGame();
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
      this.ctx.storage.setHighScore('finalfantasy', this.score);
    }
  }

  render(r) {
    r.clear(3);

    // Top HUD
    r.fillRect(0, 0, 160, 14, 1);
    r.text(`LV${this.level}`, 4, 4, 3);
    r.text(`HP:${this.hp}/${this.maxHp}`, 32, 4, 3);
    r.text(`$${this.gold}`, 90, 4, 3);
    r.text(`POT:${this.potions}`, 124, 4, 3);

    // Location banner
    r.text(this.location, 4, 18, 2);

    if (this.location === 'TOWN') {
      // Inn / Quest Giver House
      r.fillRect(20, 30, 30, 24, 1);
      r.strokeRect(20, 30, 30, 24, 0);
      r.text('QUEST', 22, 56, 0);

      // Shop
      r.fillRect(100, 30, 30, 24, 1);
      r.strokeRect(100, 30, 30, 24, 0);
      r.text('SHOP', 105, 56, 0);
    } else if (this.location === 'OVERWORLD') {
      // Trees and paths
      r.line(0, 120, 160, 120, 1);
      r.circle(30, 40, 6, 1, true);
      r.circle(130, 40, 6, 1, true);
    } else {
      // Cavern stalagmites
      r.strokeRect(10, 25, 140, 110, 0);
      r.line(20, 30, 30, 45, 1);
      r.line(130, 30, 120, 45, 1);
    }

    // Enemies
    for (const e of this.enemies) {
      if (!e.alive) continue;
      r.fillRect(e.x, e.y, 8, 8, 0);
      r.circle(e.x + 4, e.y + 4, 2, 3, true);
    }

    // Boss Dragon
    if (this.boss && this.boss.alive) {
      const b = this.boss;
      r.fillRect(b.x - 8, b.y - 8, 24, 18, 0);
      r.circle(b.x + 12, b.y - 2, 4, 1, true); // dragon head
      r.text(`DRAGON:${b.hp}`, b.x - 16, b.y - 18, 0);
    }

    // Player (Hero Knight)
    if (this.invulnerableTimer <= 0 || Math.floor(Date.now() / 80) % 2 === 0) {
      r.fillRect(this.px, this.py, 8, 12, 0);
      r.fillRect(this.px + 2, this.py + 2, 4, 3, 1);

      // Sword slash
      if (this.attackTimer > 0) {
        let sx1 = this.px + 4, sy1 = this.py + 4;
        let sx2 = sx1, sy2 = sy1;
        if (this.facing === 'UP') sy2 -= 14;
        else if (this.facing === 'DOWN') sy2 += 14;
        else if (this.facing === 'LEFT') sx2 -= 14;
        else sx2 += 14;
        r.line(sx1, sy1, sx2, sy2, 0);
      }
    }

    // Dialogue Overlay
    if (this.dialogue) {
      r.fillRect(10, 85, 140, 50, 3);
      r.strokeRect(10, 85, 140, 50, 0);
      r.text(this.dialogue, 15, 95, 0);
      r.text('▼', 138, 124, 0);
    }

    // Title Overlay
    if (this.inTitle) {
      r.fillRect(15, 30, 130, 85, 3);
      r.strokeRect(15, 30, 130, 85, 0);
      r.textCentered('FINAL FANTASY', 40, 0, 1);
      r.textCentered('ADVENTURE', 52, 1, 1);
      r.textCentered('PRESS A OR START', 76, 0, 1);
      r.textCentered('A: SWORD | B: POTION', 94, 1, 1);
    }

    // Game Over Overlay
    if (this.gameOver) {
      r.fillRect(25, 40, 110, 68, 3);
      r.strokeRect(25, 40, 110, 68, 0);
      r.textCentered('HERO FELL...', 52, 0, 1);
      r.textCentered(`SCORE: ${this.score}`, 68, 1, 1);
      r.textCentered('PRESS A TO RETRY', 85, 0, 1);
    }

    // Victory Overlay
    if (this.gameWon) {
      r.fillRect(20, 35, 120, 75, 3);
      r.strokeRect(20, 35, 120, 75, 0);
      r.textCentered('REALM SAVED!', 48, 0, 1);
      r.textCentered('SHADOW DRAGON VANQUISHED', 64, 1, 1);
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
