// Games Registry Configuration
// Contains exactly the 10 games with metadata, genre, and lazy dynamic loaders

export const GAMES = [
  {
    id: 'tetris',
    title: 'Tetris',
    genre: 'Puzzle',
    description: 'Rotate falling blocks to clear lines.',
    controlsHint: 'Arrows: Move/Drop | Z: Rotate | X: Hold',
    loader: () => import('./games/tetris.js')
  },
  {
    id: 'pokemon',
    title: 'Pokémon Red & Blue',
    genre: 'RPG',
    description: 'Capture creatures in wild grass & battle.',
    controlsHint: 'Arrows: Walk | Z: Select/A | X: Back/B',
    loader: () => import('./games/pokemon.js')
  },
  {
    id: 'zelda',
    title: "Zelda: Link's Awakening",
    genre: 'Action-adventure',
    description: 'Explore the island & conquer the dungeon.',
    controlsHint: 'Arrows: Move | Z: Sword | X: Item',
    loader: () => import('./games/zelda.js')
  },
  {
    id: 'finalfantasy',
    title: 'Final Fantasy Adventure',
    genre: 'RPG',
    description: 'Real-time action RPG quest & dungeon crawl.',
    controlsHint: 'Arrows: Move | Z: Attack | X: Potion',
    loader: () => import('./games/finalfantasy.js')
  },
  {
    id: 'mario',
    title: 'Super Mario Land 2: 6 Golden Coins',
    genre: 'Platformer',
    description: 'Run, stomp foes, & collect golden coins.',
    controlsHint: 'Arrows: Move | Z: Jump | X: Run',
    loader: () => import('./games/mario.js')
  },
  {
    id: 'metroid',
    title: 'Metroid II: Return of Samus',
    genre: 'Action',
    description: 'Explore alien caverns with beam cannon.',
    controlsHint: 'Arrows: Move/Aim | Z: Jump | X: Fire/Missile',
    loader: () => import('./games/metroid.js')
  },
  {
    id: 'castlevania',
    title: 'Castlevania: Rondo of Blood',
    genre: 'Action',
    description: 'Gothic whip combat across castle halls.',
    controlsHint: 'Arrows: Move/Stairs | Z: Jump | X: Whip',
    loader: () => import('./games/castlevania.js')
  },
  {
    id: 'donkeykong',
    title: 'Donkey Kong Land',
    genre: 'Platformer',
    description: 'Ape platforming, barrel tosses & vine climbs.',
    controlsHint: 'Arrows: Move | Z: Jump | X: Roll/Throw',
    loader: () => import('./games/donkeykong.js')
  },
  {
    id: 'snake',
    title: 'Snake',
    genre: 'Classic arcade',
    description: 'Guide the serpent, devour food, and grow.',
    controlsHint: 'Arrows / Swipe: Turn Snake',
    loader: () => import('./games/snake.js')
  },
  {
    id: 'bubble',
    title: 'Bubble',
    genre: 'Bubble shooter',
    description: 'Aim & launch bubbles to match 3 colors.',
    controlsHint: 'Arrows: Aim | Z: Launch Bubble',
    loader: () => import('./games/bubble.js')
  }
];

export const getGameById = (id) => GAMES.find(g => g.id === id) || null;
