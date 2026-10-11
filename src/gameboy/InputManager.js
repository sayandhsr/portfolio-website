// Unified Input Manager for Keyboard, Touch Controls, Swipes, and Pointer Events
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
  'NumpadEnter': BUTTONS.START,

  // SELECT
  'Shift': BUTTONS.SELECT,
  'ShiftLeft': BUTTONS.SELECT,
  'ShiftRight': BUTTONS.SELECT,
  'Backspace': BUTTONS.SELECT,
  'Tab': BUTTONS.SELECT,

  // ESCAPE / PAUSE / BACK
  'Escape': BUTTONS.ESC
};

const GAME_KEYS = new Set([
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'KeyW', 'KeyS', 'KeyA', 'KeyD', 'w', 'W', 's', 'S', 'a', 'A', 'd', 'D',
  'KeyZ', 'KeyJ', 'z', 'Z', 'j', 'J', 'Space', ' ',
  'KeyX', 'KeyK', 'x', 'X', 'k', 'K',
  'Enter', 'NumpadEnter', 'Shift', 'ShiftLeft', 'ShiftRight', 'Backspace', 'Tab', 'Escape'
]);

export class InputManager {
  constructor(targetElement = null) {
    this.targetElement = targetElement;
    this.isFocused = true;

    this.current = {};
    this.previous = {};
    this.justPressedBuffer = new Set();
    this.justReleasedBuffer = new Set();

    for (const b of Object.values(BUTTONS)) {
      this.current[b] = false;
      this.previous[b] = false;
    }

    // Touch & Swipe tracking
    this.touchAim = { x: 0, y: 0, active: false };
    this.swipeDirection = null;
    this.touchStartX = null;
    this.touchStartY = null;
    this.touchStartTime = 0;

    this.boundKeyDown = this.handleKeyDown.bind(this);
    this.boundKeyUp = this.handleKeyUp.bind(this);

    this.attach();
  }

  attach() {
    window.addEventListener('keydown', this.boundKeyDown, { capture: true, passive: false });
    window.addEventListener('keyup', this.boundKeyUp, { capture: true, passive: false });
  }

  detach() {
    window.removeEventListener('keydown', this.boundKeyDown, { capture: true });
    window.removeEventListener('keyup', this.boundKeyUp, { capture: true });
    this.reset();
  }

  setFocused(focused) {
    this.isFocused = !!focused;
  }

  handleKeyDown(e) {
    // Only block if typing inside a text input outside the Game Boy
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA') && !activeEl.classList.contains('gbx-focusable')) {
      return;
    }

    const code = e.code || e.key;
    const btn = KEY_MAPPINGS[code] || KEY_MAPPINGS[e.key];

    if (btn) {
      if (GAME_KEYS.has(code) || GAME_KEYS.has(e.key)) {
        e.preventDefault();
      }
      if (!this.current[btn]) {
        this.justPressedBuffer.add(btn);
      }
      this.current[btn] = true;
    }
  }

  handleKeyUp(e) {
    const code = e.code || e.key;
    const btn = KEY_MAPPINGS[code] || KEY_MAPPINGS[e.key];
    if (btn) {
      if (this.current[btn]) {
        this.justReleasedBuffer.add(btn);
      }
      this.current[btn] = false;
    }
  }

  // Called from touch UI buttons (press and hold)
  setButtonState(btn, isPressed) {
    if (!BUTTONS[btn]) return;
    if (isPressed) {
      if (!this.current[btn]) {
        this.justPressedBuffer.add(btn);
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try { navigator.vibrate(12); } catch {}
        }
      }
      this.current[btn] = true;
    } else {
      if (this.current[btn]) {
        this.justReleasedBuffer.add(btn);
      }
      this.current[btn] = false;
    }
  }

  // Trigger an instant button press (click / tap)
  triggerButton(btn) {
    if (!BUTTONS[btn]) return;
    this.justPressedBuffer.add(btn);
    this.current[btn] = true;
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(12); } catch {}
    }
    // Auto-reset state after engine step
    setTimeout(() => {
      this.current[btn] = false;
      this.justReleasedBuffer.add(btn);
    }, 60);
  }

  // Touch Swipe Handlers (attached to screen / canvas)
  handleTouchStart(clientX, clientY) {
    this.touchStartX = clientX;
    this.touchStartY = clientY;
    this.touchStartTime = performance.now();
    this.touchAim.active = true;
    this.touchAim.x = clientX;
    this.touchAim.y = clientY;
  }

  handleTouchMove(clientX, clientY) {
    this.touchAim.x = clientX;
    this.touchAim.y = clientY;
  }

  handleTouchEnd(clientX, clientY) {
    this.touchAim.active = false;
    if (this.touchStartX === null || this.touchStartY === null) return;

    const dx = clientX - this.touchStartX;
    const dy = clientY - this.touchStartY;
    const dist = Math.hypot(dx, dy);
    const elapsed = performance.now() - this.touchStartTime;

    if (dist > 18 && elapsed < 900) {
      // Registered swipe gesture
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) {
          this.triggerButton(BUTTONS.RIGHT);
          this.swipeDirection = 'RIGHT';
        } else {
          this.triggerButton(BUTTONS.LEFT);
          this.swipeDirection = 'LEFT';
        }
      } else {
        if (dy > 0) {
          this.triggerButton(BUTTONS.DOWN);
          this.swipeDirection = 'DOWN';
        } else {
          this.triggerButton(BUTTONS.UP);
          this.swipeDirection = 'UP';
        }
      }
    } else if (dist <= 10) {
      // Tap on canvas = Button A
      this.triggerButton(BUTTONS.A);
    }

    this.touchStartX = null;
    this.touchStartY = null;
  }

  // Advance input state at the END of each engine tick
  update() {
    this.justPressedBuffer.clear();
    this.justReleasedBuffer.clear();
    for (const b of Object.values(BUTTONS)) {
      this.previous[b] = this.current[b];
    }
    this.swipeDirection = null;
  }

  isDown(btn) {
    return !!this.current[btn] || this.justPressedBuffer.has(btn);
  }

  justPressed(btn) {
    return this.justPressedBuffer.has(btn) || (!!this.current[btn] && !this.previous[btn]);
  }

  justReleased(btn) {
    return this.justReleasedBuffer.has(btn) || (!this.current[btn] && !!this.previous[btn]);
  }

  reset() {
    for (const b of Object.values(BUTTONS)) {
      this.current[b] = false;
      this.previous[b] = false;
    }
    this.justPressedBuffer.clear();
    this.justReleasedBuffer.clear();
    this.touchAim.active = false;
    this.swipeDirection = null;
    this.touchStartX = null;
    this.touchStartY = null;
  }
}
