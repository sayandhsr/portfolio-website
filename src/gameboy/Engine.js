// Fixed 60 FPS Game Loop Engine with Accumulator and Delta Clamping

export class Engine {
  constructor({ onUpdate, onRender, input, renderer, audio }) {
    this.onUpdate = onUpdate;
    this.onRender = onRender;
    this.input = input;
    this.renderer = renderer;
    this.audio = audio;

    this.isRunning = false;
    this.isPaused = false;
    this.rafId = null;

    this.targetFps = 60;
    this.step = 1 / 60;
    this.maxAccumulator = 0.2; // Delta clamp to prevent spiral of death on tab switches

    this.lastTime = 0;
    this.accumulator = 0;

    this.boundLoop = this.loop.bind(this);
    this.boundVisibilityChange = this.handleVisibilityChange.bind(this);
    this.boundWindowBlur = this.handleWindowBlur.bind(this);

    document.addEventListener('visibilitychange', this.boundVisibilityChange);
    window.addEventListener('blur', this.boundWindowBlur);
  }

  handleVisibilityChange() {
    if (document.hidden) {
      this.pause();
    }
  }

  handleWindowBlur() {
    this.pause();
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.rafId = requestAnimationFrame(this.boundLoop);
  }

  stop() {
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  pause() {
    if (!this.isRunning || this.isPaused) return;
    this.isPaused = true;
    if (this.audio) this.audio.stopMusic();
  }

  resume() {
    if (!this.isRunning || !this.isPaused) return;
    this.isPaused = false;
    this.lastTime = performance.now();
    this.accumulator = 0;
  }

  togglePause() {
    if (this.isPaused) this.resume();
    else this.pause();
    return this.isPaused;
  }

  loop(currentTime) {
    if (!this.isRunning) return;

    let delta = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    if (delta > this.maxAccumulator) {
      delta = this.maxAccumulator;
    }

    if (!this.isPaused) {
      this.accumulator += delta;

      // Fixed timestep updates
      while (this.accumulator >= this.step) {
        if (this.input) this.input.update();
        if (this.onUpdate) this.onUpdate(this.step, this.input);
        this.accumulator -= this.step;
      }

      // Render
      if (this.renderer) this.renderer.beginFrame(delta);
      if (this.onRender) this.onRender(this.renderer);
      if (this.renderer) this.renderer.endFrame();
    }

    this.rafId = requestAnimationFrame(this.boundLoop);
  }

  destroy() {
    this.stop();
    document.removeEventListener('visibilitychange', this.boundVisibilityChange);
    window.removeEventListener('blur', this.boundWindowBlur);
  }
}
