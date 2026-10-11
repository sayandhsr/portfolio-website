// Storage manager with localStorage and in-memory fallback for iframe/restricted sandbox environments
const memoryStore = new Map();

const PREFIX = 'gbx:';

export const isLocalStorageAvailable = () => {
  try {
    const testKey = '__gbx_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

const hasLocalStorage = isLocalStorageAvailable();

export const Storage = {
  getItem(key) {
    const namespaced = key.startsWith(PREFIX) ? key : `${PREFIX}${key}`;
    if (hasLocalStorage) {
      try {
        const val = window.localStorage.getItem(namespaced);
        if (val !== null) return val;
      } catch {
        // Fallback to memoryStore
      }
    }
    return memoryStore.has(namespaced) ? memoryStore.get(namespaced) : null;
  },

  setItem(key, value) {
    const namespaced = key.startsWith(PREFIX) ? key : `${PREFIX}${key}`;
    const stringVal = String(value);
    if (hasLocalStorage) {
      try {
        window.localStorage.setItem(namespaced, stringVal);
      } catch {
        // Fallback
      }
    }
    memoryStore.set(namespaced, stringVal);
  },

  removeItem(key) {
    const namespaced = key.startsWith(PREFIX) ? key : `${PREFIX}${key}`;
    if (hasLocalStorage) {
      try {
        window.localStorage.removeItem(namespaced);
      } catch {}
    }
    memoryStore.delete(namespaced);
  },

  getHighScore(gameId) {
    const val = this.getItem(`high:${gameId}`);
    return val ? parseInt(val, 10) || 0 : 0;
  },

  setHighScore(gameId, score) {
    const current = this.getHighScore(gameId);
    if (score > current) {
      this.setItem(`high:${gameId}`, score);
      return true;
    }
    return false;
  },

  getLastPlayed() {
    return this.getItem('last_played') || null;
  },

  setLastPlayed(gameId) {
    this.setItem('last_played', gameId);
  },

  getSettings() {
    const raw = this.getItem('settings');
    const defaults = {
      palette: 'classic', // 'classic' (green) or 'grayscale'
      soundEnabled: true,
      volume: 0.3,
      touchControls: 'auto', // 'auto', 'always', 'never'
      reducedMotion: false
    };
    if (!raw) return defaults;
    try {
      return { ...defaults, ...JSON.parse(raw) };
    } catch {
      return defaults;
    }
  },

  saveSettings(settings) {
    this.setItem('settings', JSON.stringify(settings));
  },

  getSaveSlot(gameId, slot = 0) {
    const raw = this.getItem(`save:${gameId}:${slot}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  writeSaveSlot(gameId, slot = 0, data = {}) {
    this.setItem(`save:${gameId}:${slot}`, JSON.stringify(data));
  },

  // Migrate legacy keys if they exist in localStorage
  migrateLegacy() {
    if (!hasLocalStorage) return;
    try {
      const legacyKeys = [
        { oldKey: 'snake-score', newKey: 'high:snake' },
        { oldKey: 'snake_score', newKey: 'high:snake' },
        { oldKey: 'retro_snake_score', newKey: 'high:snake' },
        { oldKey: 'breakout_score', newKey: 'high:bubble' },
        { oldKey: 'bubble_score', newKey: 'high:bubble' }
      ];

      for (const item of legacyKeys) {
        const oldVal = window.localStorage.getItem(item.oldKey);
        if (oldVal !== null) {
          const num = parseInt(oldVal, 10);
          if (!isNaN(num)) {
            const currentNew = this.getHighScore(item.newKey.replace('high:', ''));
            if (num > currentNew) {
              this.setItem(item.newKey, num);
            }
          }
          // Remove legacy key after migrating
          try {
            window.localStorage.removeItem(item.oldKey);
          } catch {}
        }
      }
    } catch {
      // Ignored
    }
  }
};
