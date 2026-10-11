import { drawPixelText, measurePixelText } from './PixelFont.js';

export const PALETTES = {
  classic: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'], // 0=Darkest, 1=Dark, 2=Light, 3=Lightest
  grayscale: ['#0f0f0f', '#404040', '#909090', '#e0e0e0']
};

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.width = 160;
    this.height = 144;
    this.paletteName = 'classic';
    this.palette = PALETTES.classic;
    this.reducedMotion = false;

    // Shake & Flash effects
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.shakeOffset = { x: 0, y: 0 };
    this.flashFrames = 0;
    this.flashColor = 3;

    // Crisp pixel rendering
    this.ctx.imageSmoothingEnabled = false;
  }

  setPalette(name) {
    if (PALETTES[name]) {
      this.paletteName = name;
      this.palette = PALETTES[name];
    }
  }

  setReducedMotion(enabled) {
    this.reducedMotion = !!enabled;
  }

  getColor(shadeIndex) {
    if (typeof shadeIndex === 'string' && shadeIndex.startsWith('#')) return shadeIndex;
    const idx = Math.max(0, Math.min(3, Math.floor(shadeIndex)));
    return this.palette[idx] || this.palette[0];
  }

  beginFrame(dt) {
    // Process screen shake
    if (!this.reducedMotion && this.shakeDuration > 0) {
      this.shakeDuration -= dt;
      if (this.shakeDuration <= 0) {
        this.shakeOffset = { x: 0, y: 0 };
        this.shakeIntensity = 0;
      } else {
        const factor = this.shakeIntensity;
        this.shakeOffset = {
          x: Math.round((Math.random() - 0.5) * factor * 2),
          y: Math.round((Math.random() - 0.5) * factor * 2)
        };
      }
    } else {
      this.shakeOffset = { x: 0, y: 0 };
    }

    this.ctx.save();
    this.ctx.translate(this.shakeOffset.x, this.shakeOffset.y);
  }

  endFrame() {
    this.ctx.restore();

    // Render flash if active and reduced motion is off
    if (!this.reducedMotion && this.flashFrames > 0) {
      this.flashFrames--;
      this.ctx.fillStyle = this.getColor(this.flashColor);
      this.ctx.fillRect(0, 0, this.width, this.height);
    }
  }

  shake(intensity = 3, duration = 0.2) {
    if (this.reducedMotion) return;
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
  }

  flash(frames = 2, shade = 3) {
    if (this.reducedMotion) return;
    this.flashFrames = frames;
    this.flashColor = shade;
  }

  clear(shade = 3) {
    this.ctx.fillStyle = this.getColor(shade);
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  fillRect(x, y, w, h, shade = 0) {
    this.ctx.fillStyle = this.getColor(shade);
    this.ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
  }

  strokeRect(x, y, w, h, shade = 0) {
    this.ctx.strokeStyle = this.getColor(shade);
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(Math.floor(x) + 0.5, Math.floor(y) + 0.5, Math.floor(w) - 1, Math.floor(h) - 1);
  }

  line(x1, y1, x2, y2, shade = 0) {
    this.ctx.strokeStyle = this.getColor(shade);
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(Math.floor(x1) + 0.5, Math.floor(y1) + 0.5);
    this.ctx.lineTo(Math.floor(x2) + 0.5, Math.floor(y2) + 0.5);
    this.ctx.stroke();
  }

  circle(cx, cy, r, shade = 0, filled = true) {
    this.ctx.beginPath();
    this.ctx.arc(Math.floor(cx), Math.floor(cy), Math.floor(r), 0, Math.PI * 2);
    if (filled) {
      this.ctx.fillStyle = this.getColor(shade);
      this.ctx.fill();
    } else {
      this.ctx.strokeStyle = this.getColor(shade);
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
    }
  }

  text(str, x, y, shade = 0, scale = 1) {
    return drawPixelText(this.ctx, str, x, y, this.getColor(shade), scale);
  }

  textCentered(str, y, shade = 0, scale = 1) {
    const lines = String(str).split('\n');
    let currentY = Math.floor(y);
    for (const line of lines) {
      const w = measurePixelText(line, scale);
      const x = Math.floor((this.width - w) / 2);
      drawPixelText(this.ctx, line, x, currentY, this.getColor(shade), scale);
      currentY += 8 * scale;
    }
  }

  measureText(str, scale = 1) {
    return measurePixelText(str, scale);
  }

  // Draw 2D bitmap sprite: array of strings or row arrays
  // mapping e.g. '0' -> transparent or shade 3, '1' -> 0, etc.
  drawSprite(spriteMatrix, x, y, colorMap = { '1': 0 }, scale = 1) {
    const startX = Math.floor(x);
    const startY = Math.floor(y);
    for (let r = 0; r < spriteMatrix.length; r++) {
      const row = spriteMatrix[r];
      for (let c = 0; c < row.length; c++) {
        const char = row[c];
        if (char !== ' ' && char !== '.' && colorMap[char] !== undefined) {
          const shade = colorMap[char];
          this.ctx.fillStyle = this.getColor(shade);
          this.ctx.fillRect(startX + c * scale, startY + r * scale, scale, scale);
        }
      }
    }
  }
}
