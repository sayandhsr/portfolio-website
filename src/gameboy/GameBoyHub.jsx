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

  // React UI States
  const [bootPhase, setBootPhase] = useState('booting'); // 'booting' | 'ready'
  const [activeGameId, setActiveGameId] = useState(null);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [isFocused, setIsFocused] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [paletteName, setPaletteName] = useState('classic');
  const [touchSetting, setTouchSetting] = useState('always'); // 'always', 'auto', 'never'
  const [reducedMotion, setReducedMotion] = useState(false);
  const [layoutMode, setLayoutMode] = useState('stacked');
  const [screenScale, setScreenScale] = useState(1);

  // Mutable refs for 60 FPS Engine RAF loop to eliminate stale closure traps
  const bootPhaseRef = useRef('booting');
  const activeGameRef = useRef(null);
  const activeGameIdRef = useRef(null);
  const selectedIdxRef = useRef(0);
  const bootTimerRef = useRef(0);
  const settingsOpenRef = useRef(false);
  const isFocusedRef = useRef(true);

  // Synchronize refs
  activeGameIdRef.current = activeGameId;
  selectedIdxRef.current = selectedIdx;
  bootPhaseRef.current = bootPhase;
  settingsOpenRef.current = settingsOpen;
  isFocusedRef.current = isFocused;

  // Updatable loop handlers to prevent closure capture
  const onUpdateRef = useRef(null);
  const onRenderRef = useRef(null);

  // Instant skip boot sequence
  const skipBoot = useCallback(() => {
    audioRef.current?.ensureContext();
    bootPhaseRef.current = 'ready';
    setBootPhase('ready');
  }, []);

  // Launch a selected game
  const launchGame = useCallback(async (gameId) => {
    const meta = GAMES.find(g => g.id === gameId);
    if (!meta) return;

    try {
      audioRef.current?.ensureContext();
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
      activeGameIdRef.current = gameId;
      setActiveGameId(gameId);
      Storage.setLastPlayed(gameId);
    } catch (err) {
      console.error('Failed to load game cartridge:', err);
    }
  }, []);

  // Return to Cartridge Menu
  const returnToMenu = useCallback(() => {
    if (activeGameRef.current?.destroy) {
      activeGameRef.current.destroy();
    }
    activeGameRef.current = null;
    activeGameIdRef.current = null;
    setActiveGameId(null);
    audioRef.current?.stopAll();
    shellRef.current?.focus();
    inputRef.current?.setFocused(true);
  }, []);

  // Initialize Subsystems
  useEffect(() => {
    Storage.migrateLegacy();
    const settings = Storage.getSettings();
    setPaletteName(settings.palette || 'classic');
    setTouchSetting(settings.touchControls || 'always');
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

    // Engine 60 FPS fixed timestep loop
    const engine = new Engine({
      renderer,
      input,
      audio,
      onUpdate: (dt, inp) => {
        onUpdateRef.current?.(dt, inp);
      },
      onRender: (rnd) => {
        onRenderRef.current?.(rnd);
      }
    });
    engineRef.current = engine;
    engine.start();

    // Auto-focus shell for instant keyboard reception
    setTimeout(() => {
      shellRef.current?.focus();
      input.setFocused(true);
    }, 20);

    // Initial boot sequence
    bootTimerRef.current = 0;
    bootPhaseRef.current = 'booting';
    setTimeout(() => {
      audio.playBootChime();
    }, 200);

    // Auto-pause when scrolled out of view via IntersectionObserver
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

      // Layout: side-by-side if wide, stacked if tall/narrow
      const isWide = w > 520 && w > h * 1.15;
      const newLayout = isWide ? 'side' : 'stacked';
      setLayoutMode(newLayout);

      // Available screen space calculation
      let availW = newLayout === 'side' ? Math.max(160, w * 0.58 - 30) : w - 24;
      let availH = newLayout === 'side' ? h - 30 : Math.max(144, h * 0.58 - 30);

      // Integer scale calculation (160x144 canvas)
      let intScale = Math.floor(Math.min(availW / 160, availH / 144));
      if (intScale < 1) {
        intScale = Math.min(availW / 160, availH / 144);
      }
      setScreenScale(Math.max(0.75, Math.min(4, intScale)));
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(shell);
    handleResize();

    return () => resizeObserver.disconnect();
  }, []);

  // Update logic dispatched by Engine 60 FPS
  const handleUpdate = (dt, input) => {
    // 1. Boot Phase
    if (bootPhaseRef.current === 'booting') {
      bootTimerRef.current += dt;
      // Skip boot on any key/button press or timeout after 1.2s
      if (
        input.justPressed(BUTTONS.A) ||
        input.justPressed(BUTTONS.START) ||
        input.justPressed(BUTTONS.B) ||
        input.justPressed(BUTTONS.SELECT) ||
        input.justPressed(BUTTONS.UP) ||
        input.justPressed(BUTTONS.DOWN) ||
        input.justPressed(BUTTONS.LEFT) ||
        input.justPressed(BUTTONS.RIGHT) ||
        bootTimerRef.current > 1.2
      ) {
        skipBoot();
      }
      return;
    }

    // 2. Active Game Running
    if (activeGameRef.current) {
      if (input.justPressed(BUTTONS.ESC)) {
        returnToMenu();
        return;
      }
      activeGameRef.current.update(dt, input);
      return;
    }

    // 3. Settings modal open: pause menu interaction
    if (settingsOpenRef.current) {
      if (
        input.justPressed(BUTTONS.B) ||
        input.justPressed(BUTTONS.ESC) ||
        input.justPressed(BUTTONS.SELECT)
      ) {
        setSettingsOpen(false);
      }
      return;
    }

    // 4. Cartridge Selection Menu Navigation
    if (input.justPressed(BUTTONS.UP)) {
      const next = selectedIdxRef.current > 0 ? selectedIdxRef.current - 1 : GAMES.length - 1;
      selectedIdxRef.current = next;
      setSelectedIdx(next);
      audioRef.current?.playCursor();
    } else if (input.justPressed(BUTTONS.DOWN)) {
      const next = selectedIdxRef.current < GAMES.length - 1 ? selectedIdxRef.current + 1 : 0;
      selectedIdxRef.current = next;
      setSelectedIdx(next);
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

  // Render logic dispatched by Engine
  const handleRender = (r) => {
    // 1. Boot Phase Screen
    if (bootPhaseRef.current === 'booting') {
      r.clear(3);
      // Classic dropping Game Boy logo animation
      const progress = Math.min(1, bootTimerRef.current / 0.55);
      const logoY = Math.floor(progress * 52);

      r.fillRect(20, logoY, 120, 24, 0);
      r.fillRect(22, logoY + 2, 116, 20, 3);
      r.textCentered('GAME BOY', logoY + 8, 0, 1);
      r.text('®', 116, logoY + 7, 0);

      r.textCentered('NINTENDO®', 108, 1, 1);
      return;
    }

    // 2. Active Game Screen
    if (activeGameRef.current) {
      activeGameRef.current.render(r);
      return;
    }

    // 3. Cartridge Selection Menu
    r.clear(3);

    // Top Header Banner
    r.fillRect(0, 0, 160, 16, 0);
    r.textCentered('SELECT CARTRIDGE', 5, 3, 1);

    // Display 4 games around current index
    const total = GAMES.length;
    const current = selectedIdxRef.current;
    const pageStart = Math.max(0, Math.min(total - 4, current - 1));

    for (let i = 0; i < 4; i++) {
      const idx = pageStart + i;
      if (idx >= total) break;
      const game = GAMES[idx];
      const isSelected = idx === current;
      const y = 22 + i * 26;

      if (isSelected) {
        // Highlight active row
        r.fillRect(4, y - 2, 152, 24, 1);
        r.fillRect(6, y, 148, 20, 3);
        r.text('▶', 8, y + 6, 0);
      }

      // Title & Genre
      r.text(game.title.substring(0, 17), isSelected ? 20 : 12, y + 2, isSelected ? 0 : 1);
      r.text(game.genre, isSelected ? 20 : 12, y + 11, 2);

      // High Score / Last Played
      const hi = Storage.getHighScore(game.id);
      const isLast = Storage.getLastPlayed() === game.id;
      if (isLast) {
        r.text('LAST', 128, y + 2, 0);
      } else if (hi > 0) {
        r.text(`HI:${hi}`, 115, y + 2, 1);
      }
    }

    // Bottom Navigation Bar
    r.line(4, 126, 156, 126, 1);
    r.text(`[${current + 1}/${total}]`, 8, 131, 1);
    r.text('A:PLAY  SELECT:SET', 52, 131, 0);
  };

  // Keep RAF handler refs fresh on every render
  onUpdateRef.current = handleUpdate;
  onRenderRef.current = handleRender;

  // Canvas Click / Tap Handler
  const handleCanvasClick = (e) => {
    audioRef.current?.ensureContext();
    shellRef.current?.focus();
    inputRef.current?.setFocused(true);
    engineRef.current?.resume();

    // Skip boot if currently booting
    if (bootPhaseRef.current === 'booting') {
      skipBoot();
      return;
    }

    // Direct game selection by clicking row in menu
    if (!activeGameRef.current && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const scaleY = 144 / rect.height;
      const clickY = (e.clientY - rect.top) * scaleY;

      const total = GAMES.length;
      const current = selectedIdxRef.current;
      const pageStart = Math.max(0, Math.min(total - 4, current - 1));

      for (let i = 0; i < 4; i++) {
        const rowY = 22 + i * 26;
        if (clickY >= rowY - 2 && clickY <= rowY + 24) {
          const clickedIdx = pageStart + i;
          if (clickedIdx < total) {
            if (selectedIdxRef.current === clickedIdx) {
              // Clicked already selected game -> Launch!
              audioRef.current?.playSelect();
              launchGame(GAMES[clickedIdx].id);
            } else {
              // Select clicked game
              selectedIdxRef.current = clickedIdx;
              setSelectedIdx(clickedIdx);
              audioRef.current?.playCursor();
            }
          }
          break;
        }
      }
    }
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

  // Touch & Mouse Virtual Button Handlers
  const handleTouchButton = (btn, isDown) => {
    audioRef.current?.ensureContext();
    inputRef.current?.setButtonState(btn, isDown);
  };

  // Controls Visibility: default to always show so desktop mouse & touch users can use it
  const shouldShowTouch = touchSetting !== 'never';

  return (
    <div className="gbx-root" ref={rootRef}>
      {/* Game Boy Unified Header */}
      <div className="gbx-header">
        <div className="gbx-header-title">
          <span>🎮</span>
          <span>{activeGameId ? GAMES.find(g => g.id === activeGameId)?.title : 'GAME BOY HUB'}</span>
        </div>

        <div className="gbx-header-actions">
          {activeGameId && (
            <button className="gbx-btn" onClick={returnToMenu} title="Return to Cartridge Menu">
              MENU
            </button>
          )}

          <button className="gbx-btn" onClick={() => setSettingsOpen(prev => !prev)} title="Game Boy Settings">
            ⚙
          </button>

          <button className="gbx-btn" onClick={handleToggleMute} title="Toggle Sound">
            {isMuted ? '🔇' : '🔊'}
          </button>

          <button className="gbx-btn" onClick={onToggleExpand} title={isExpanded ? 'Collapse View' : 'Expand View'}>
            {isExpanded ? '⤢' : '⤡'}
          </button>

          <button className="gbx-btn exit-btn" onClick={onExit} title="Exit Game Boy (Esc)">
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
          engineRef.current?.resume();
        }}
        onBlur={(e) => {
          if (e.currentTarget && e.relatedTarget && e.currentTarget.contains(e.relatedTarget)) {
            return;
          }
          setIsFocused(false);
        }}
        onClick={() => {
          audioRef.current?.ensureContext();
          shellRef.current?.focus();
          inputRef.current?.setFocused(true);
          engineRef.current?.resume();
          if (bootPhaseRef.current === 'booting') {
            skipBoot();
          }
        }}
      >
        {/* Screen Housing */}
        <div className="gbx-screen-housing" onClick={handleCanvasClick}>
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

        {/* Subtle click-to-focus warning hint if focus was lost */}
        {!isFocused && (
          <div className="gbx-focus-hint" onClick={() => shellRef.current?.focus()}>
            CLICK TO FOCUS GAME BOY
          </div>
        )}

        {/* Controls Panel (Authentic Handheld Layout) */}
        {shouldShowTouch && (
          <div className="gbx-controls-panel">
            <div className="gbx-primary-controls">
              {/* D-Pad */}
              <div className="gbx-dpad-wrapper">
                <div className="gbx-dpad-container">
                  <div />
                  <button
                    className="gbx-dpad-btn"
                    onMouseDown={(e) => e.preventDefault()}
                    onPointerDown={(e) => { e.preventDefault(); handleTouchButton(BUTTONS.UP, true); }}
                    onPointerUp={() => handleTouchButton(BUTTONS.UP, false)}
                    onPointerCancel={() => handleTouchButton(BUTTONS.UP, false)}
                    onPointerLeave={() => handleTouchButton(BUTTONS.UP, false)}
                    title="D-Pad Up (W / Up Arrow)"
                  >
                    ▲
                  </button>
                  <div />
                  <button
                    className="gbx-dpad-btn"
                    onMouseDown={(e) => e.preventDefault()}
                    onPointerDown={(e) => { e.preventDefault(); handleTouchButton(BUTTONS.LEFT, true); }}
                    onPointerUp={() => handleTouchButton(BUTTONS.LEFT, false)}
                    onPointerCancel={() => handleTouchButton(BUTTONS.LEFT, false)}
                    onPointerLeave={() => handleTouchButton(BUTTONS.LEFT, false)}
                    title="D-Pad Left (A / Left Arrow)"
                  >
                    ◀
                  </button>
                  <div className="gbx-dpad-center" />
                  <button
                    className="gbx-dpad-btn"
                    onMouseDown={(e) => e.preventDefault()}
                    onPointerDown={(e) => { e.preventDefault(); handleTouchButton(BUTTONS.RIGHT, true); }}
                    onPointerUp={() => handleTouchButton(BUTTONS.RIGHT, false)}
                    onPointerCancel={() => handleTouchButton(BUTTONS.RIGHT, false)}
                    onPointerLeave={() => handleTouchButton(BUTTONS.RIGHT, false)}
                    title="D-Pad Right (D / Right Arrow)"
                  >
                    ▶
                  </button>
                  <div />
                  <button
                    className="gbx-dpad-btn"
                    onMouseDown={(e) => e.preventDefault()}
                    onPointerDown={(e) => { e.preventDefault(); handleTouchButton(BUTTONS.DOWN, true); }}
                    onPointerUp={() => handleTouchButton(BUTTONS.DOWN, false)}
                    onPointerCancel={() => handleTouchButton(BUTTONS.DOWN, false)}
                    onPointerLeave={() => handleTouchButton(BUTTONS.DOWN, false)}
                    title="D-Pad Down (S / Down Arrow)"
                  >
                    ▼
                  </button>
                  <div />
                </div>
                <span className="gbx-control-hint">WASD / ARROWS</span>
              </div>

              {/* Action Buttons A & B */}
              <div className="gbx-action-buttons-wrapper">
                <div className="gbx-action-buttons">
                  <div className="gbx-round-btn-wrapper">
                    <button
                      className="gbx-round-btn"
                      onMouseDown={(e) => e.preventDefault()}
                      onPointerDown={(e) => { e.preventDefault(); handleTouchButton(BUTTONS.B, true); }}
                      onPointerUp={() => handleTouchButton(BUTTONS.B, false)}
                      onPointerCancel={() => handleTouchButton(BUTTONS.B, false)}
                      onPointerLeave={() => handleTouchButton(BUTTONS.B, false)}
                      title="B Button (X / K / Back)"
                    >
                      B
                    </button>
                    <span className="gbx-btn-label">B [X]</span>
                  </div>

                  <div className="gbx-round-btn-wrapper">
                    <button
                      className="gbx-round-btn"
                      onMouseDown={(e) => e.preventDefault()}
                      onPointerDown={(e) => { e.preventDefault(); handleTouchButton(BUTTONS.A, true); }}
                      onPointerUp={() => handleTouchButton(BUTTONS.A, false)}
                      onPointerCancel={() => handleTouchButton(BUTTONS.A, false)}
                      onPointerLeave={() => handleTouchButton(BUTTONS.A, false)}
                      title="A Button (Z / Space / Select)"
                    >
                      A
                    </button>
                    <span className="gbx-btn-label">A [Z]</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SELECT & START Pill Buttons */}
            <div className="gbx-system-buttons">
              <div className="gbx-pill-btn-wrapper">
                <button
                  className="gbx-pill-btn"
                  onMouseDown={(e) => e.preventDefault()}
                  onPointerDown={(e) => { e.preventDefault(); handleTouchButton(BUTTONS.SELECT, true); }}
                  onPointerUp={() => handleTouchButton(BUTTONS.SELECT, false)}
                  onPointerCancel={() => handleTouchButton(BUTTONS.SELECT, false)}
                  onPointerLeave={() => handleTouchButton(BUTTONS.SELECT, false)}
                  title="SELECT (Shift / Backspace)"
                />
                <span className="gbx-pill-label">SELECT [SHIFT]</span>
              </div>

              <div className="gbx-pill-btn-wrapper">
                <button
                  className="gbx-pill-btn"
                  onMouseDown={(e) => e.preventDefault()}
                  onPointerDown={(e) => { e.preventDefault(); handleTouchButton(BUTTONS.START, true); }}
                  onPointerUp={() => handleTouchButton(BUTTONS.START, false)}
                  onPointerCancel={() => handleTouchButton(BUTTONS.START, false)}
                  onPointerLeave={() => handleTouchButton(BUTTONS.START, false)}
                  title="START (Enter)"
                />
                <span className="gbx-pill-label">START [ENTER]</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal Overlay */}
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
              <span>CONTROLS DISPLAY:</span>
              <select
                className="gbx-setting-select"
                value={touchSetting}
                onChange={e => {
                  const val = e.target.value;
                  setTouchSetting(val);
                  Storage.saveSettings({ ...Storage.getSettings(), touchControls: val });
                }}
              >
                <option value="always">Always Show Controls</option>
                <option value="auto">Auto (Touch Devices)</option>
                <option value="never">Hide Virtual Controls</option>
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

            <button className="gbx-btn" style={{ marginTop: '0.6rem', width: '100%' }} onClick={() => setSettingsOpen(false)}>
              DONE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameBoyHub;
