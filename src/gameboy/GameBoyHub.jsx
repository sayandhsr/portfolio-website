import { useState, useRef, useEffect, useCallback } from 'react';
import { GAMES } from './games.config';
import { Engine } from './Engine';
import { Renderer } from './Renderer';
import { InputManager, BUTTONS } from './InputManager';
import { AudioManager } from './AudioManager';
import { Storage } from './Storage';
import './GameBoyHub.css';

export const GameBoyHub = ({ onExit, onToggleExpand, isExpanded = false }) => {
  const rootRef = useRef(null);
  const shellRef = useRef(null);
  const canvasRef = useRef(null);

  // Core subsystems
  const engineRef = useRef(null);
  const rendererRef = useRef(null);
  const inputRef = useRef(null);
  const audioRef = useRef(null);

  // States
  const [bootPhase, setBootPhase] = useState('booting'); // 'booting' | 'ready'
  const [activeGameId, setActiveGameId] = useState(null);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [isFocused, setIsFocused] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [paletteName, setPaletteName] = useState('classic');
  const [touchSetting, setTouchSetting] = useState('auto'); // 'auto', 'always', 'never'
  const [reducedMotion, setReducedMotion] = useState(false);
  const [layoutMode, setLayoutMode] = useState('stacked');
  const [screenScale, setScreenScale] = useState(1);

  // Active game instance
  const activeGameRef = useRef(null);
  const activeGameIdRef = useRef(null);
  const selectedIdxRef = useRef(0);
  const bootTimerRef = useRef(0);

  // Keep refs in sync
  activeGameIdRef.current = activeGameId;
  selectedIdxRef.current = selectedIdx;

  // Initialize Core Subsystems
  useEffect(() => {
    Storage.migrateLegacy();
    const settings = Storage.getSettings();
    setPaletteName(settings.palette || 'classic');
    setTouchSetting(settings.touchControls || 'auto');
    setReducedMotion(!!settings.reducedMotion);
    setIsMuted(!settings.soundEnabled);

    // Audio Manager
    const audio = new AudioManager();
    audio.setVolume(settings.volume ?? 0.3);
    audio.setMuted(!settings.soundEnabled);
    audioRef.current = audio;

    // Input Manager
    const input = new InputManager(shellRef.current);
    inputRef.current = input;

    // Renderer
    const canvas = canvasRef.current;
    const renderer = new Renderer(canvas);
    renderer.setPalette(settings.palette || 'classic');
    renderer.setReducedMotion(settings.reducedMotion);
    rendererRef.current = renderer;

    // Engine
    const engine = new Engine({
      renderer,
      input,
      audio,
      onUpdate: (dt, inp) => {
        handleUpdate(dt, inp);
      },
      onRender: (rnd) => {
        handleRender(rnd);
      }
    });
    engineRef.current = engine;
    engine.start();

    // Focus shell
    shellRef.current?.focus();

    // Start boot sequence
    bootTimerRef.current = 0;
    setTimeout(() => {
      audio.playBootChime();
    }, 250);

    // IntersectionObserver to auto-pause when scrolled out of view
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            engineRef.current?.pause();
          } else {
            engineRef.current?.resume();
          }
        });
      },
      { threshold: 0.2 }
    );

    if (rootRef.current) {
      observer.observe(rootRef.current);
    }

    return () => {
      observer.disconnect();
      engine.destroy();
      input.detach();
      audio.destroy();
      if (activeGameRef.current?.destroy) {
        activeGameRef.current.destroy();
      }
    };
  }, []);

  // Responsive Layout & Scaling via ResizeObserver
  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;

    const handleResize = () => {
      const w = shell.clientWidth;
      const h = shell.clientHeight;
      if (!w || !h) return;

      // Determine Layout Mode: side-by-side if wide, stacked if tall
      const newLayout = w > h * 1.25 && w > 420 ? 'side' : 'stacked';
      setLayoutMode(newLayout);

      // Available screen space calculation
      let availW = newLayout === 'side' ? Math.max(160, w * 0.55 - 24) : w - 24;
      let availH = newLayout === 'side' ? h - 24 : Math.max(144, h * 0.58 - 30);

      // Integer scale calculation
      let intScale = Math.floor(Math.min(availW / 160, availH / 144));
      if (intScale < 1) {
        // Fractional scale
        intScale = Math.min(availW / 160, availH / 144);
      }
      setScreenScale(Math.max(0.7, intScale));
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(shell);
    handleResize();

    return () => resizeObserver.disconnect();
  }, []);

  // Update loop dispatched by Engine
  const handleUpdate = (dt, input) => {
    // 1. Boot Phase
    if (bootPhase === 'booting') {
      bootTimerRef.current += dt;
      // Skip boot on any key press
      if (
        input.justPressed(BUTTONS.A) ||
        input.justPressed(BUTTONS.START) ||
        input.justPressed(BUTTONS.B) ||
        bootTimerRef.current > 1.6
      ) {
        setBootPhase('ready');
      }
      return;
    }

    // 2. Active Game Running
    if (activeGameRef.current) {
      activeGameRef.current.update(dt, input);
      return;
    }

    // 3. Menu Navigation
    if (input.justPressed(BUTTONS.UP)) {
      setSelectedIdx(prev => (prev > 0 ? prev - 1 : GAMES.length - 1));
      audioRef.current?.playCursor();
    } else if (input.justPressed(BUTTONS.DOWN)) {
      setSelectedIdx(prev => (prev < GAMES.length - 1 ? prev + 1 : 0));
      audioRef.current?.playCursor();
    } else if (input.justPressed(BUTTONS.A) || input.justPressed(BUTTONS.START)) {
      audioRef.current?.playSelect();
      launchGame(GAMES[selectedIdxRef.current].id);
    } else if (input.justPressed(BUTTONS.SELECT)) {
      setSettingsOpen(prev => !prev);
      audioRef.current?.playCursor();
    } else if (input.justPressed(BUTTONS.ESC) || input.justPressed(BUTTONS.B)) {
      onExit();
    }
  };

  // Render loop dispatched by Engine
  const handleRender = (r) => {
    // 1. Boot Phase Rendering
    if (bootPhase === 'booting') {
      r.clear(3);
      // Logo dropping in from top
      const progress = Math.min(1, bootTimerRef.current / 0.8);
      const logoY = Math.floor(progress * 55);

      r.fillRect(20, logoY, 120, 24, 0);
      r.fillRect(22, logoY + 2, 116, 20, 3);
      r.textCentered('GAME BOY', logoY + 8, 0, 1);
      r.text('®', 115, logoY + 6, 0);

      r.textCentered('NINTENDO®', 110, 1, 1);
      return;
    }

    // 2. Active Game Rendering
    if (activeGameRef.current) {
      activeGameRef.current.render(r);
      return;
    }

    // 3. Game Select Screen Rendering
    r.clear(3);

    // Menu Top Header
    r.fillRect(0, 0, 160, 16, 0);
    r.textCentered('GAME BOY CARTRIDGES', 5, 3, 1);

    // List of games: display 4 games at a time based on current index
    const total = GAMES.length;
    const pageStart = Math.max(0, Math.min(total - 4, selectedIdx - 1));

    for (let i = 0; i < 4; i++) {
      const idx = pageStart + i;
      if (idx >= total) break;
      const game = GAMES[idx];
      const isSelected = idx === selectedIdx;
      const y = 24 + i * 26;

      if (isSelected) {
        // Highlight row
        r.fillRect(4, y - 2, 152, 24, 1);
        r.fillRect(6, y, 148, 20, 3);
        r.text('▶', 8, y + 6, 0);
      }

      // Title & Genre
      r.text(game.title.substring(0, 18), isSelected ? 20 : 12, y + 2, isSelected ? 0 : 1);
      r.text(game.genre, isSelected ? 20 : 12, y + 11, 2);

      // High Score / Tag
      const hi = Storage.getHighScore(game.id);
      const isLast = Storage.getLastPlayed() === game.id;
      if (isLast) {
        r.text('LAST', 128, y + 2, 0);
      } else if (hi > 0) {
        r.text(`HI:${hi}`, 115, y + 2, 1);
      }
    }

    // Page indicator
    r.line(4, 126, 156, 126, 1);
    r.text(`[${selectedIdx + 1}/${total}]`, 8, 131, 1);
    r.text('A:PLAY  SELECT:SET', 54, 131, 0);
  };

  // Launch a game
  const launchGame = async (gameId) => {
    const meta = GAMES.find(g => g.id === gameId);
    if (!meta) return;

    try {
      const mod = await meta.loader();
      const GameClass = mod.default || mod;
      const instance = new GameClass();

      instance.init({
        renderer: rendererRef.current,
        input: inputRef.current,
        audio: audioRef.current,
        storage: Storage,
        onGameOver: () => {},
        onScoreUpdate: (score) => {
          Storage.setHighScore(gameId, score);
        }
      });

      activeGameRef.current = instance;
      setActiveGameId(gameId);
      Storage.setLastPlayed(gameId);
    } catch {
      // Fallback
    }
  };

  // Return to Game Boy Menu
  const returnToMenu = () => {
    if (activeGameRef.current?.destroy) {
      activeGameRef.current.destroy();
    }
    activeGameRef.current = null;
    setActiveGameId(null);
    audioRef.current?.stopAll();
  };

  // Palette toggler
  const handlePaletteChange = (name) => {
    setPaletteName(name);
    rendererRef.current?.setPalette(name);
    Storage.saveSettings({
      ...Storage.getSettings(),
      palette: name
    });
  };

  // Mute toggler
  const handleToggleMute = () => {
    const next = audioRef.current?.toggleMute() ?? false;
    setIsMuted(next);
    Storage.saveSettings({
      ...Storage.getSettings(),
      soundEnabled: !next
    });
  };

  // Touch button events
  const handleTouchButton = (btn, isDown) => {
    inputRef.current?.setButtonState(btn, isDown);
  };

  // Should show touch controls?
  const shouldShowTouch = touchSetting === 'always' || (touchSetting === 'auto' && (typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)));

  return (
    <div className="gbx-root" ref={rootRef}>
      {/* Game Boy Top Header inside chatbot window */}
      <div className="gbx-header">
        <div className="gbx-header-title">
          <span>🎮</span>
          <span>{activeGameId ? GAMES.find(g => g.id === activeGameId)?.title : 'GAME BOY HUB'}</span>
        </div>

        <div className="gbx-header-actions">
          {activeGameId && (
            <button className="gbx-btn" onClick={returnToMenu} title="Return to Game Menu">
              MENU
            </button>
          )}

          <button className="gbx-btn" onClick={() => setSettingsOpen(prev => !prev)} title="Settings">
            ⚙
          </button>

          <button className="gbx-btn" onClick={handleToggleMute} title="Toggle Audio">
            {isMuted ? '🔇' : '🔊'}
          </button>

          <button className="gbx-btn" onClick={onToggleExpand} title={isExpanded ? 'Collapse' : 'Expand'}>
            {isExpanded ? '⤢' : '⤡'}
          </button>

          <button className="gbx-btn exit-btn" onClick={onExit} title="Exit Game Boy">
            ✕ EXIT
          </button>
        </div>
      </div>

      {/* Main Game Boy Shell */}
      <div
        className={`gbx-shell layout-${layoutMode}`}
        ref={shellRef}
        tabIndex={0}
        onFocus={() => {
          setIsFocused(true);
          inputRef.current?.setFocused(true);
        }}
        onBlur={() => {
          setIsFocused(false);
          inputRef.current?.setFocused(false);
        }}
        onClick={() => {
          shellRef.current?.focus();
        }}
      >
        {/* Screen Housing */}
        <div className="gbx-screen-housing">
          <div className="gbx-screen-top-bar">
            <div className="gbx-power-indicator">
              <span className="gbx-power-led" />
              <span>BATTERY</span>
            </div>
            <span>DOT MATRIX WITH STEREO SOUND</span>
          </div>

          <div
            className="gbx-canvas-wrapper"
            style={{
              width: `${160 * screenScale}px`,
              height: `${144 * screenScale}px`
            }}
          >
            <canvas
              ref={canvasRef}
              width={160}
              height={144}
              className="gbx-canvas"
              style={{
                width: `${160 * screenScale}px`,
                height: `${144 * screenScale}px`
              }}
            />
          </div>

          <div className="gbx-screen-bottom-bar">GAME BOY™</div>
        </div>

        {/* Subtle click to focus hint if focus is lost */}
        {!isFocused && (
          <div className="gbx-focus-hint">
            CLICK TO FOCUS KEYBOARD
          </div>
        )}

        {/* Controls Panel (D-Pad & Buttons) */}
        {shouldShowTouch && (
          <div className="gbx-controls-panel">
            {/* D-Pad */}
            <div className="gbx-dpad-container">
              <div />
              <button
                className="gbx-dpad-btn"
                onPointerDown={(e) => { e.preventDefault(); handleTouchButton(BUTTONS.UP, true); }}
                onPointerUp={() => handleTouchButton(BUTTONS.UP, false)}
                onPointerCancel={() => handleTouchButton(BUTTONS.UP, false)}
                onPointerLeave={() => handleTouchButton(BUTTONS.UP, false)}
              >
                ▲
              </button>
              <div />
              <button
                className="gbx-dpad-btn"
                onPointerDown={(e) => { e.preventDefault(); handleTouchButton(BUTTONS.LEFT, true); }}
                onPointerUp={() => handleTouchButton(BUTTONS.LEFT, false)}
                onPointerCancel={() => handleTouchButton(BUTTONS.LEFT, false)}
                onPointerLeave={() => handleTouchButton(BUTTONS.LEFT, false)}
              >
                ◀
              </button>
              <div className="gbx-dpad-center" />
              <button
                className="gbx-dpad-btn"
                onPointerDown={(e) => { e.preventDefault(); handleTouchButton(BUTTONS.RIGHT, true); }}
                onPointerUp={() => handleTouchButton(BUTTONS.RIGHT, false)}
                onPointerCancel={() => handleTouchButton(BUTTONS.RIGHT, false)}
                onPointerLeave={() => handleTouchButton(BUTTONS.RIGHT, false)}
              >
                ▶
              </button>
              <div />
              <button
                className="gbx-dpad-btn"
                onPointerDown={(e) => { e.preventDefault(); handleTouchButton(BUTTONS.DOWN, true); }}
                onPointerUp={() => handleTouchButton(BUTTONS.DOWN, false)}
                onPointerCancel={() => handleTouchButton(BUTTONS.DOWN, false)}
                onPointerLeave={() => handleTouchButton(BUTTONS.DOWN, false)}
              >
                ▼
              </button>
              <div />
            </div>

            {/* A & B Action Buttons */}
            <div className="gbx-action-buttons">
              <div className="gbx-round-btn-wrapper">
                <button
                  className="gbx-round-btn"
                  onPointerDown={(e) => { e.preventDefault(); handleTouchButton(BUTTONS.B, true); }}
                  onPointerUp={() => handleTouchButton(BUTTONS.B, false)}
                  onPointerCancel={() => handleTouchButton(BUTTONS.B, false)}
                  onPointerLeave={() => handleTouchButton(BUTTONS.B, false)}
                >
                  B
                </button>
                <span className="gbx-btn-label">B</span>
              </div>

              <div className="gbx-round-btn-wrapper">
                <button
                  className="gbx-round-btn"
                  onPointerDown={(e) => { e.preventDefault(); handleTouchButton(BUTTONS.A, true); }}
                  onPointerUp={() => handleTouchButton(BUTTONS.A, false)}
                  onPointerCancel={() => handleTouchButton(BUTTONS.A, false)}
                  onPointerLeave={() => handleTouchButton(BUTTONS.A, false)}
                >
                  A
                </button>
                <span className="gbx-btn-label">A</span>
              </div>
            </div>

            {/* SELECT & START Pill Buttons */}
            <div className="gbx-system-buttons">
              <div className="gbx-pill-btn-wrapper">
                <button
                  className="gbx-pill-btn"
                  onPointerDown={(e) => { e.preventDefault(); handleTouchButton(BUTTONS.SELECT, true); }}
                  onPointerUp={() => handleTouchButton(BUTTONS.SELECT, false)}
                  onPointerCancel={() => handleTouchButton(BUTTONS.SELECT, false)}
                  onPointerLeave={() => handleTouchButton(BUTTONS.SELECT, false)}
                />
                <span className="gbx-pill-label">SELECT</span>
              </div>

              <div className="gbx-pill-btn-wrapper">
                <button
                  className="gbx-pill-btn"
                  onPointerDown={(e) => { e.preventDefault(); handleTouchButton(BUTTONS.START, true); }}
                  onPointerUp={() => handleTouchButton(BUTTONS.START, false)}
                  onPointerCancel={() => handleTouchButton(BUTTONS.START, false)}
                  onPointerLeave={() => handleTouchButton(BUTTONS.START, false)}
                />
                <span className="gbx-pill-label">START</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {settingsOpen && (
        <div className="gbx-settings-overlay" onClick={() => setSettingsOpen(false)}>
          <div className="gbx-settings-card" onClick={e => e.stopPropagation()}>
            <div className="gbx-settings-header">
              <span>GAME BOY SETTINGS</span>
              <button className="gbx-btn" onClick={() => setSettingsOpen(false)}>✕</button>
            </div>

            <div className="gbx-setting-row">
              <span>COLOR PALETTE:</span>
              <select
                className="gbx-setting-select"
                value={paletteName}
                onChange={e => handlePaletteChange(e.target.value)}
              >
                <option value="classic">Classic Green (1989)</option>
                <option value="grayscale">Pocket Gray (1996)</option>
              </select>
            </div>

            <div className="gbx-setting-row">
              <span>TOUCH CONTROLS:</span>
              <select
                className="gbx-setting-select"
                value={touchSetting}
                onChange={e => {
                  const val = e.target.value;
                  setTouchSetting(val);
                  Storage.saveSettings({ ...Storage.getSettings(), touchControls: val });
                }}
              >
                <option value="auto">Auto (Touch Devices)</option>
                <option value="always">Always Show</option>
                <option value="never">Hide</option>
              </select>
            </div>

            <div className="gbx-setting-row">
              <span>REDUCED MOTION:</span>
              <input
                type="checkbox"
                checked={reducedMotion}
                onChange={e => {
                  const checked = e.target.checked;
                  setReducedMotion(checked);
                  rendererRef.current?.setReducedMotion(checked);
                  Storage.saveSettings({ ...Storage.getSettings(), reducedMotion: checked });
                }}
              />
            </div>

            <button className="gbx-btn" style={{ marginTop: '0.5rem' }} onClick={() => setSettingsOpen(false)}>
              DONE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameBoyHub;
