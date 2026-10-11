// Unified Input Manager for Keyboard and Touch Controls
// Exposes: UP, DOWN, LEFT, RIGHT, A, B, START, SELECT, ESC

export const BUTTONS = {
  UP: 'UP',
  DOWN: 'DOWN',
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
  A: 'A',
  B: 'B',
  START: 'START',
  SELECT: 'SELECT',
  ESC: 'ESC'
};

const KEY_MAPPINGS = {
  // D-Pad
  'ArrowUp': BUTTONS.UP,
  'KeyW': BUTTONS.UP,
  'w': BUTTONS.UP,
  'W': BUTTONS.UP,

  'ArrowDown': BUTTONS.DOWN,
  'KeyS': BUTTONS.DOWN,
  's': BUTTONS.DOWN,
  'S': BUTTONS.DOWN,

  'ArrowLeft': BUTTONS.LEFT,
  'KeyA': BUTTONS.LEFT,
  'a': BUTTONS.LEFT,
  'A': BUTTONS.LEFT,

  'ArrowRight': BUTTONS.RIGHT,
  'KeyD': BUTTONS.RIGHT,
  'd': BUTTONS.RIGHT,
  'D': BUTTONS.RIGHT,

  // A Button
  'KeyZ': BUTTONS.A,
  'z': BUTTONS.A,
  'Z': BUTTONS.A,
  'KeyJ': BUTTONS.A,
  'j': BUTTONS.A,
  'J': BUTTONS.A,
  'Space': BUTTONS.A,
  ' ': BUTTONS.A,

  // B Button
  'KeyX': BUTTONS.B,
  'x': BUTTONS.B,
  'X': BUTTONS.B,
  'KeyK': BUTTONS.B,
  'k': BUTTONS.B,
  'K': BUTTONS.B,

  // START
  'Enter': BUTTONS.START,

  // SELECT
  'Shift': BUTTONS.SELECT,
  'ShiftLeft': BUTTONS.SELECT,
  'ShiftRight': BUTTONS.SELECT,
  'Backspace': BUTTONS.SELECT,

  // ESCAPE / PAUSE
  'Escape': BUTTONS.ESC
};

const GAME_KEYS = new Set([
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'KeyW', 'KeyS', 'KeyA', 'KeyD', 'w', 'W', 's', 'S', 'a', 'A', 'd', 'D',
  'KeyZ', 'KeyJ', 'z', 'Z', 'j', 'J', 'Space', ' ',
  'KeyX', 'KeyK', 'x', 'X', 'k', 'K',
  'Enter', 'Shift', 'ShiftLeft', 'ShiftRight', 'Backspace', 'Escape'
]);

export class InputManager {
  constructor(targetElement = null) {
    this.targetElement = targetElement;
    this.isFocused = true;

    this.current = {};
    this.previous = {};

    for (const b of Object.values(BUTTONS)) {
      this.current[b] = false;
      this.previous[b] = false;
    }

    // Touch custom tracking (e.g. swipe for snake, drag for bubble)
    this.touchAim = { x: 0, y: 0, active: false };
    this.swipeDirection = null;

    this.boundKeyDown = this.handleKeyDown.bind(this);
    this.boundKeyUp = this.handleKeyUp.bind(this);

    this.attach();
  }

  attach() {
    window.addEventListener('keydown', this.boundKeyDown, { capture: true });
    window.addEventListener('keyup', this.boundKeyUp, { capture: true });
  }

  detach() {
    window.removeEventListener('keydown', this.boundKeyDown, { capture: true });
    window.removeEventListener('keyup', this.boundKeyUp, { capture: true });
    this.reset();
  }

  setFocused(focused) {
    this.isFocused = !!focused;
    if (!this.isFocused) {
      this.reset();
    }
  }

  handleKeyDown(e) {
    if (!this.isFocused) return;

    // Check if target is inside an unrelated form input outside the gameboy
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA') && !activeEl.classList.contains('gbx-focusable')) {
      return;
    }

    const code = e.code || e.key;
    const btn = KEY_MAPPINGS[code] || KEY_MAPPINGS[e.key];

    if (btn) {
      // Prevent scrolling only for game keys while focused
      if (GAME_KEYS.has(code) || GAME_KEYS.has(e.key)) {
        e.preventDefault();
      }
      this.current[btn] = true;
    }
  }

  handleKeyUp(e) {
    if (!this.isFocused) return;
    const code = e.code || e.key;
    const btn = KEY_MAPPINGS[code] || KEY_MAPPINGS[e.key];
    if (btn) {
      this.current[btn] = false;
    }
  }

  // Called from touch UI buttons
  setButtonState(btn, isPressed) {
    if (!BUTTONS[btn]) return;
    if (isPressed && !this.current[btn]) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(10); } catch {}
      }
    }
    this.current[btn] = !!isPressed;
  }

  // Update input states at start/end of engine tick
  update() {
    for (const b of Object.values(BUTTONS)) {
      this.previous[b] = this.current[b];
    }
    this.swipeDirection = null;
  }

  isDown(btn) {
    return !!this.current[btn];
  }

  justPressed(btn) {
    return !!this.current[btn] && !this.previous[btn];
  }

  justReleased(btn) {
    return !this.current[btn] && !!this.previous[btn];
  }

  reset() {
    for (const b of Object.values(BUTTONS)) {
      this.current[b] = false;
      this.previous[b] = false;
    }
    this.touchAim.active = false;
    this.swipeDirection = null;
  }
}
