// Pokémon Red & Blue (Original Creature Collection RPG)
import { BUTTONS } from '../InputManager.js';

export const CREATURES = [
  { id: 1, name: 'SPROUTLING', type: 'GRASS', hp: 20, maxHp: 20, atk: 6, def: 5 },
  { id: 2, name: 'EMBERPUP', type: 'FIRE', hp: 18, maxHp: 18, atk: 7, def: 4 },
  { id: 3, name: 'AQUAFIN', type: 'WATER', hp: 22, maxHp: 22, atk: 5, def: 6 },
  { id: 4, name: 'VOLTSPARK', type: 'ELECTRIC', hp: 19, maxHp: 19, atk: 8, def: 3 },
  { id: 5, name: 'LEAFWING', type: 'GRASS', hp: 24, maxHp: 24, atk: 7, def: 6 },
  { id: 6, name: 'PYROCRAW', type: 'FIRE', hp: 22, maxHp: 22, atk: 9, def: 5 },
  { id: 7, name: 'TIDEWAVE', type: 'WATER', hp: 26, maxHp: 26, atk: 6, def: 8 },
  { id: 8, name: 'THUNDERBULL', type: 'ELECTRIC', hp: 25, maxHp: 25, atk: 10, def: 5 }
];

export const TYPE_ADVANTAGE = {
  FIRE: { GRASS: 2.0, WATER: 0.5, FIRE: 1.0, ELECTRIC: 1.0 },
  WATER: { FIRE: 2.0, GRASS: 0.5, WATER: 1.0, ELECTRIC: 1.0 },
  GRASS: { WATER: 2.0, FIRE: 0.5, GRASS: 1.0, ELECTRIC: 1.0 },
  ELECTRIC: { WATER: 2.0, GRASS: 0.5, FIRE: 1.0, ELECTRIC: 1.0 }
};

export default class PokemonGame {
  constructor() {
    this.ctx = null;
    this.state = 'OVERWORLD'; // 'OVERWORLD' or 'BATTLE'
    this.area = 0; // 0: PALLET, 1: ROUTE 1 (Grass), 2: VIRIDIAN
    this.score = 0;

    // Party
    this.party = [];
    this.balls = 5;
    this.potions = 3;

    // Player grid coordinates
    this.gx = 5;
    this.gy = 5;
    this.facing = 'DOWN';

    // Battle State
    this.battle = null;
    this.battleMenuIdx = 0; // 0: Fight, 1: Catch, 2: Item, 3: Run
    this.battleText = '';

    this.dialogue = null;
    this.gameOver = false;
    this.inTitle = true;
    this.paused = false;
  }

  init(ctx) {
    this.ctx = ctx;
    this.inTitle = true;
    this.loadGame(true);
  }

  loadGame(keepTitle = false) {
    const saved = this.ctx.storage.getSaveSlot('pokemon', 0);
    if (saved && saved.party && saved.party.length > 0) {
      this.party = saved.party;
      this.balls = saved.balls ?? 5;
      this.potions = saved.potions ?? 3;
      this.score = saved.score ?? 0;
    } else {
      // Starter creature
      this.party = [{ ...CREATURES[1], level: 5, exp: 0 }]; // EMBERPUP starter
    }
    this.reset(keepTitle);
  }

  saveGame() {
    this.ctx.storage.writeSaveSlot('pokemon', 0, {
      party: this.party,
      balls: this.balls,
      potions: this.potions,
      score: this.score
    });
    this.ctx.audio.playSelect();
  }

  reset(keepTitle = false) {
    this.state = 'OVERWORLD';
    this.area = 0;
    this.gx = 5;
    this.gy = 6;
    this.facing = 'DOWN';
    this.battle = null;
    this.dialogue = null;
    this.gameOver = false;
    if (!keepTitle) {
      this.inTitle = false;
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

    if (this.gameOver) {
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

    if (this.state === 'OVERWORLD') {
      this.updateOverworld(dt, input);
    } else if (this.state === 'BATTLE') {
      this.updateBattle(dt, input);
    }
  }

  updateOverworld(dt, input) {
    let dx = 0, dy = 0;
    if (input.justPressed(BUTTONS.UP)) { dy = -1; this.facing = 'UP'; }
    else if (input.justPressed(BUTTONS.DOWN)) { dy = 1; this.facing = 'DOWN'; }
    else if (input.justPressed(BUTTONS.LEFT)) { dx = -1; this.facing = 'LEFT'; }
    else if (input.justPressed(BUTTONS.RIGHT)) { dx = 1; this.facing = 'RIGHT'; }

    if (dx !== 0 || dy !== 0) {
      const targetX = this.gx + dx;
      const targetY = this.gy + dy;

      // Area transition North / South
      if (targetY < 2) {
        if (this.area < 2) {
          this.area++;
          this.gy = 10;
          this.ctx.audio.playCursor();
          return;
        }
      } else if (targetY > 11) {
        if (this.area > 0) {
          this.area--;
          this.gy = 3;
          this.ctx.audio.playCursor();
          return;
        }
      }

      this.gx = Math.max(1, Math.min(9, targetX));
      this.gy = Math.max(2, Math.min(10, targetY));
      this.ctx.audio.playCursor();

      // Check tall-grass wild encounters in Route 1 (area 1)
      if (this.area === 1) {
        const inGrass = (this.gx >= 2 && this.gx <= 8 && this.gy >= 4 && this.gy <= 9);
        if (inGrass && Math.random() < 0.35) {
          this.startBattle();
        }
      }

      // Check Town NPC interactions
      if (this.area === 0 && this.gx === 3 && this.gy === 4) {
        this.dialogue = 'PROFESSOR OAK:\nTALL GRASS IS DANGEROUS!\nEXPLORE ROUTE 1 TO CATCH!';
        this.saveGame();
      }
      if (this.area === 2 && this.gx === 5 && this.gy === 3) {
        // Heal center
        this.party.forEach(p => p.hp = p.maxHp);
        this.dialogue = 'NURSE:\nYOUR CREATURES HAVE BEEN\nFULLY RESTORED TO MAX HP!';
        this.ctx.audio.playPowerup();
        this.saveGame();
      }
    }
  }

  startBattle() {
    this.state = 'BATTLE';
    this.battleMenuIdx = 0;
    // Pick random wild creature
    const template = CREATURES[Math.floor(Math.random() * CREATURES.length)];
    const wildLvl = Math.floor(Math.random() * 4) + 3;
    this.battle = {
      wild: { ...template, hp: template.hp, maxHp: template.hp, level: wildLvl },
      activeParty: this.party[0],
      turn: 'PLAYER',
      animTimer: 0
    };
    this.battleWaitTimer = 0;
    this.battlePendingState = null;
    this.battleText = `A WILD ${this.battle.wild.name}\nAPPEARED!`;
    this.ctx.audio.playLaser();
    this.ctx.renderer.flash(4, 3);
  }

  updateBattle(dt, input) {
    if (this.battle.animTimer > 0) {
      this.battle.animTimer -= dt;
      return;
    }

    // Pending deterministic state transitions (faint, captured, run away)
    if (this.battleWaitTimer > 0) {
      this.battleWaitTimer -= dt;
      if (this.battleWaitTimer <= 0) {
        if (this.battlePendingState === 'OVERWORLD') {
          this.state = 'OVERWORLD';
          this.battle = null;
          this.saveGame();
        } else if (this.battlePendingState === 'GAMEOVER') {
          this.gameOver = true;
          this.battle = null;
        }
        this.battlePendingState = null;
      }
      return;
    }

    // Battle menu navigation: [0: FIGHT, 1: CATCH, 2: ITEM, 3: RUN]
    if (input.justPressed(BUTTONS.LEFT)) {
      if (this.battleMenuIdx % 2 === 1) this.battleMenuIdx--;
      this.ctx.audio.playCursor();
    } else if (input.justPressed(BUTTONS.RIGHT)) {
      if (this.battleMenuIdx % 2 === 0) this.battleMenuIdx++;
      this.ctx.audio.playCursor();
    } else if (input.justPressed(BUTTONS.UP)) {
      if (this.battleMenuIdx >= 2) this.battleMenuIdx -= 2;
      this.ctx.audio.playCursor();
    } else if (input.justPressed(BUTTONS.DOWN)) {
      if (this.battleMenuIdx <= 1) this.battleMenuIdx += 2;
      this.ctx.audio.playCursor();
    }

    // Select option (A button)
    if (input.justPressed(BUTTONS.A)) {
      const { wild, activeParty } = this.battle;

      if (this.battleMenuIdx === 0) {
        // 1. FIGHT
        const mult = (TYPE_ADVANTAGE[activeParty.type]?.[wild.type]) || 1.0;
        const dmg = Math.max(2, Math.floor((activeParty.atk * mult) - wild.def / 2));
        wild.hp -= dmg;
        this.ctx.audio.playHit();
        this.ctx.renderer.shake(2, 0.15);

        if (wild.hp <= 0) {
          wild.hp = 0;
          this.battleText = `${wild.name} FAINTED!\nWON 250 PTS!`;
          this.score += 250;
          activeParty.exp += 25;
          if (activeParty.exp >= activeParty.level * 30) {
            activeParty.level++;
            activeParty.maxHp += 4;
            activeParty.atk += 2;
            activeParty.hp = activeParty.maxHp;
            this.battleText = `${activeParty.name} GREW TO\nLEVEL ${activeParty.level}!`;
          }
          this.ctx.audio.playPowerup();
          this.battleWaitTimer = 1.2;
          this.battlePendingState = 'OVERWORLD';
          return;
        }

        // Enemy turn
        const enemyDmg = Math.max(1, Math.floor(wild.atk - activeParty.def / 2));
        activeParty.hp -= enemyDmg;
        this.battleText = `${wild.name} ATTACKED!\nDEALT ${enemyDmg} DMG!`;

        if (activeParty.hp <= 0) {
          activeParty.hp = 0;
          this.battleText = `${activeParty.name} FAINTED!\nOUT OF CREATURES!`;
          this.ctx.audio.playGameOver();
          this.battleWaitTimer = 1.2;
          this.battlePendingState = 'GAMEOVER';
        }
      } else if (this.battleMenuIdx === 1) {
        // 2. CATCH (Pokéball)
        if (this.balls > 0) {
          this.balls--;
          const catchChance = (1 - (wild.hp / wild.maxHp)) * 0.8 + 0.2;
          this.ctx.audio.playSelect();
          if (Math.random() < catchChance) {
            this.party.push(wild);
            this.score += 500;
            this.battleText = `GOTCHA!\n${wild.name} CAUGHT!`;
            this.ctx.audio.playPowerup();
            this.battleWaitTimer = 1.2;
            this.battlePendingState = 'OVERWORLD';
          } else {
            this.battleText = `OH NO!\n${wild.name} BROKE FREE!`;
          }
        } else {
          this.battleText = 'OUT OF POKÉBALLS!';
        }
      } else if (this.battleMenuIdx === 2) {
        // 3. ITEM (Potion)
        if (this.potions > 0) {
          this.potions--;
          activeParty.hp = Math.min(activeParty.maxHp, activeParty.hp + 15);
          this.battleText = 'USED POTION!\nRECOVERED 15 HP.';
          this.ctx.audio.playPowerup();
        } else {
          this.battleText = 'NO POTIONS LEFT!';
        }
      } else if (this.battleMenuIdx === 3) {
        // 4. RUN
        this.battleText = 'GOT AWAY SAFELY!';
        this.ctx.audio.playSelect();
        this.battleWaitTimer = 0.8;
        this.battlePendingState = 'OVERWORLD';
      }
    }
  }

  render(r) {
    r.clear(3);

    if (this.state === 'OVERWORLD') {
      this.renderOverworld(r);
    } else {
      this.renderBattle(r);
    }

    // How to Play / Title Screen Overlay
    if (this.inTitle) {
      r.fillRect(8, 16, 144, 118, 3);
      r.strokeRect(8, 16, 144, 118, 0);
      r.strokeRect(10, 18, 140, 114, 1);

      r.textCentered('POKÉMON', 22, 0, 1);
      r.textCentered('RED & BLUE', 32, 1, 1);
      r.line(16, 42, 144, 42, 1);

      r.textCentered('NOTICE: HOW TO PLAY', 46, 1, 1);
      r.text('ARROWS/WASD: WALK GRID', 16, 58, 0);
      r.text('A / Z : TALK / CHOOSE / FIGHT', 16, 70, 0);
      r.text('B / X : CANCEL / BACK / RUN', 16, 82, 0);
      r.text('EXPLORE TALL GRASS FOR MONS', 16, 94, 1);

      r.fillRect(18, 108, 124, 16, 0);
      r.textCentered('PRESS A OR START', 112, 3, 1);
    }

    // Game Over Overlay
    if (this.gameOver) {
      r.fillRect(20, 36, 120, 74, 3);
      r.strokeRect(20, 36, 120, 74, 0);
      r.strokeRect(22, 38, 116, 70, 1);
      r.textCentered('BLACKED OUT!', 46, 0, 1);
      r.textCentered(`SCORE: ${this.score}`, 62, 1, 1);
      r.textCentered('VISIT POKÉCENTER', 74, 1, 1);
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

  renderOverworld(r) {
    // Top HUD
    r.fillRect(0, 0, 160, 14, 1);
    const areaNames = ['PALLET TOWN', 'ROUTE 1', 'VIRIDIAN CITY'];
    r.text(areaNames[this.area], 4, 4, 3);
    r.text(`BALLS:${this.balls}`, 92, 4, 3);
    r.text(`P:${this.party.length}`, 142, 4, 3);

    // Map graphics
    if (this.area === 1) {
      // Tall grass tiles
      for (let gy = 4; gy <= 9; gy++) {
        for (let gx = 2; gx <= 8; gx++) {
          const tx = gx * 14;
          const ty = gy * 11;
          r.text('#', tx, ty, 1);
        }
      }
    } else if (this.area === 0) {
      // Pallet town house & lab
      r.fillRect(20, 30, 36, 24, 1);
      r.strokeRect(20, 30, 36, 24, 0);
      r.text('OAK', 28, 56, 0);
    } else {
      // Viridian PokeCenter
      r.fillRect(45, 25, 40, 26, 1);
      r.strokeRect(45, 25, 40, 26, 0);
      r.text('CENTER', 48, 54, 0);
    }

    // Player (Red trainer sprite)
    const px = this.gx * 14;
    const py = this.gy * 11;
    r.fillRect(px, py, 8, 12, 0);
    r.fillRect(px + 2, py + 2, 4, 3, 1); // cap visor
    r.fillRect(px + 1, py + 5, 6, 4, 2); // shirt

    // Dialogue Overlay - Clean, distinct box with multi-line support
    if (this.dialogue) {
      r.fillRect(8, 84, 144, 52, 3);
      r.strokeRect(8, 84, 144, 52, 0);
      r.strokeRect(10, 86, 140, 48, 1);
      r.text(this.dialogue, 14, 92, 0);
      r.text('▼', 138, 122, 0);
    }
  }

  renderBattle(r) {
    const { wild, activeParty } = this.battle;

    // Wild Creature (Top Right)
    r.text(wild.name, 76, 16, 0);
    r.text(`:L${wild.level}`, 134, 16, 1);
    r.text(`HP:${wild.hp}/${wild.maxHp}`, 76, 26, 0);
    r.strokeRect(76, 34, 68, 5, 0);
    const wildHpW = Math.max(0, Math.floor((wild.hp / wild.maxHp) * 66));
    r.fillRect(77, 35, wildHpW, 3, 1);

    // Wild front sprite (procedural pixel art)
    this.renderFrontSprite(r, wild, 36, 44);

    // Player Creature (Bottom Left)
    r.text(activeParty.name, 10, 64, 0);
    r.text(`:L${activeParty.level}`, 68, 64, 1);
    r.text(`HP:${activeParty.hp}/${activeParty.maxHp}`, 10, 74, 0);
    r.strokeRect(10, 82, 68, 5, 0);
    const partyHpW = Math.max(0, Math.floor((activeParty.hp / activeParty.maxHp) * 66));
    r.fillRect(11, 83, partyHpW, 3, 0);

    // Player back sprite (Trainer back silhouette)
    this.renderBackSprite(r, 120, 76);

    // Battle Text Box / Menu
    r.fillRect(0, 94, 160, 50, 3);
    r.strokeRect(0, 94, 160, 50, 0);
    r.strokeRect(2, 96, 156, 46, 1);

    if (this.battleWaitTimer > 0) {
      // Event status message (won, faint, catch, run)
      r.text(this.battleText, 12, 106, 0);
      r.text('▼', 144, 132, 0);
    } else {
      // Menu options: 2x2 grid
      r.text('WHAT WILL RED DO?', 10, 102, 0);

      const options = ['FIGHT', 'CATCH', 'ITEM', 'RUN'];
      const coords = [
        { x: 24, y: 118 }, { x: 92, y: 118 },
        { x: 24, y: 130 }, { x: 92, y: 130 }
      ];

      for (let i = 0; i < 4; i++) {
        const opt = options[i];
        const pos = coords[i];
        if (this.battleMenuIdx === i) {
          r.text('▶', pos.x - 8, pos.y, 0);
        }
        r.text(opt, pos.x, pos.y, 0);
      }
    }
  }

  renderFrontSprite(r, monster, cx, cy) {
    // Detailed pixel monster sprite
    r.fillRect(cx - 10, cy - 8, 20, 16, 1);
    r.strokeRect(cx - 10, cy - 8, 20, 16, 0);
    // Eyes
    r.fillRect(cx - 6, cy - 4, 3, 3, 0);
    r.fillRect(cx + 3, cy - 4, 3, 3, 0);
    // Ears/Horns
    r.fillRect(cx - 8, cy - 12, 4, 4, 0);
    r.fillRect(cx + 4, cy - 12, 4, 4, 0);
    // Snout / Teeth
    r.fillRect(cx - 2, cy + 2, 4, 2, 0);
  }

  renderBackSprite(r, cx, cy) {
    // Red trainer back sprite
    r.fillRect(cx - 8, cy - 6, 16, 16, 0);
    // Cap
    r.fillRect(cx - 6, cy - 10, 12, 5, 1);
    // Cap bill
    r.fillRect(cx - 9, cy - 7, 3, 2, 1);
    // Collar & backpack strap
    r.fillRect(cx - 4, cy - 2, 8, 4, 2);
  }
}
