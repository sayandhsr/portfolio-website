// Trigger matcher for opening Game Boy view
// Exact or close match for: "games", "game", "game boy", "gameboy", "game-boy", "play games"
// Must reject individual game titles or queries about games

const VALID_TRIGGERS = [
  'games',
  'game',
  'game boy',
  'gameboy',
  'game-boy',
  'play games',
  'play game',
  'playgame',
  'playgames'
];

const DISALLOWED_GAME_TITLES = [
  'tetris',
  'pokemon',
  'pokémon',
  'zelda',
  'link',
  'final fantasy',
  'mario',
  'metroid',
  'samus',
  'castlevania',
  'donkey kong',
  'snake',
  'bubble',
  'breakout'
];

// Simple Levenshtein distance
const levenshtein = (a, b) => {
  const an = a.length;
  const bn = b.length;
  if (an === 0) return bn;
  if (bn === 0) return an;
  const matrix = Array.from({ length: bn + 1 }, () => new Array(an + 1).fill(0));
  for (let i = 0; i <= an; i++) matrix[0][i] = i;
  for (let j = 0; j <= bn; j++) matrix[j][0] = j;
  for (let j = 1; j <= bn; j++) {
    for (let i = 1; i <= an; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j - 1][i] + 1,
        matrix[j][i - 1] + 1,
        matrix[j - 1][i - 1] + cost
      );
    }
  }
  return matrix[bn][an];
};

export const isGameBoyTrigger = (rawInput) => {
  if (!rawInput || typeof rawInput !== 'string') return false;
  const clean = rawInput
    .toLowerCase()
    .trim()
    .replace(/^>\s*/, '')
    .replace(/[!?.#]+$/, '')
    .trim();

  if (!clean) return false;

  // Never match if query contains a specific game title unless it's strictly a trigger
  for (const title of DISALLOWED_GAME_TITLES) {
    if (clean === title || clean.includes(title)) {
      return false;
    }
  }

  // Exact trigger match
  if (VALID_TRIGGERS.includes(clean)) {
    return true;
  }

  // Check hyphen/space variations
  const noSpaceOrDash = clean.replace(/[\s-_]+/g, '');
  if (noSpaceOrDash === 'gameboy' || noSpaceOrDash === 'playgames' || noSpaceOrDash === 'games' || noSpaceOrDash === 'game') {
    return true;
  }

  // Fuzzy match for small typos (distance <= 1 on core triggers)
  for (const t of ['game', 'games', 'gameboy', 'game boy', 'play games']) {
    if (Math.abs(clean.length - t.length) <= 1 && levenshtein(clean, t) <= 1) {
      return true;
    }
  }

  return false;
};
