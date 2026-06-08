import { GameType } from '@/types';

// Game list with icons and metadata
export const GAMES = [
  {
    id: GameType.FC26,
    name: 'Final Combat 26',
    shortName: 'FC26',
    icon: '🥊',
    description: 'Fast-paced team fighting game with 2v2 or 1v1 modes',
    color: '#FF6B35',
  },
  {
    id: GameType.Tekken8,
    name: 'Tekken 8',
    shortName: 'Tekken8',
    icon: '👊',
    description: 'Classic 1v1 3D fighting game',
    color: '#1E90FF',
  },
  {
    id: GameType.SF6,
    name: 'Street Fighter 6',
    shortName: 'SF6',
    icon: '🔥',
    description: '1v1 traditional 2D fighting game',
    color: '#FFD700',
  },
  {
    id: GameType.MK1,
    name: 'Mortal Kombat 1',
    shortName: 'MK1',
    icon: '💀',
    description: 'Intense 1v1 fighting game',
    color: '#FF1493',
  },
  {
    id: GameType.KOFXV,
    name: 'King of Fighters XV',
    shortName: 'KOFXV',
    icon: '👑',
    description: '3v3 team-based fighting game',
    color: '#FFD700',
  },
  {
    id: GameType.Naruto,
    name: 'Naruto Shippuden Ultimate Ninja Storm',
    shortName: 'Naruto',
    icon: '🍃',
    description: '3v3 team fighting game with ninja abilities',
    color: '#FF8C00',
  },
];

// Fighter/Character rosters per game
export const FIGHTERS = {
  [GameType.FC26]: [
    'Blaze',
    'Sonja',
    'K\'',
    'Duke',
    'Ryu',
    'Ken',
    'Chun-Li',
    'Guile',
    'Juri',
    'Cammy',
  ],
  [GameType.Tekken8]: [
    'Kazuya',
    'Jin',
    'Paul',
    'Nina',
    'King',
    'Yoshimitsu',
    'Hwoarang',
    'Asuka',
    'Ling',
    'Steve',
    'Alisa',
    'Leo',
  ],
  [GameType.SF6]: [
    'Ryu',
    'Ken',
    'Chun-Li',
    'Guile',
    'Juri',
    'Cammy',
    'Dhalsim',
    'Blanka',
    'E. Honda',
    'Zangief',
    'M. Bison',
    'Marisa',
  ],
  [GameType.MK1]: [
    'Liu Kang',
    'Kung Lao',
    'Sub-Zero',
    'Scorpion',
    'Sonya Blade',
    'Johnny Cage',
    'Jax',
    'Kano',
    'Nightwolf',
    'Sindel',
    'Sheeva',
    'Kitana',
  ],
  [GameType.KOFXV]: [
    'Kyo',
    'Iori',
    'Ash',
    'K\'',
    'Maxima',
    'Whip',
    'Shun\'ei',
    'Blue Mary',
    'Andy',
    'Joe',
    'Mai',
    'Leona',
  ],
  [GameType.Naruto]: [
    'Naruto',
    'Sasuke',
    'Sakura',
    'Kakashi',
    'Itachi',
    'Jiraiya',
    'Orochimaru',
    'Pain',
    'Madara',
    'Hashirama',
    'Tsunade',
    'Minato',
  ],
};

// Game aliases for slug matching
export const GAME_SLUGS: Record<string, GameType> = {
  'fc26': GameType.FC26,
  'tekken8': GameType.Tekken8,
  'tekken': GameType.Tekken8,
  'sf6': GameType.SF6,
  'street-fighter': GameType.SF6,
  'mk1': GameType.MK1,
  'mortal-kombat': GameType.MK1,
  'kofxv': GameType.KOFXV,
  'king-of-fighters': GameType.KOFXV,
  'naruto': GameType.Naruto,
};

// Get game by ID
export const getGame = (gameId: GameType | string) => {
  return GAMES.find((g) => g.id === gameId);
};

// Get game by slug
export const getGameBySlug = (slug: string) => {
  const gameId = GAME_SLUGS[slug.toLowerCase()];
  return getGame(gameId);
};

// Get fighters for a game
export const getFighters = (gameId: GameType | string): string[] => {
  return FIGHTERS[gameId as GameType] || [];
};

// Team size per game format
export const TEAM_SIZES: Record<GameType, number> = {
  [GameType.FC26]: 2,
  [GameType.Tekken8]: 1,
  [GameType.SF6]: 1,
  [GameType.MK1]: 1,
  [GameType.KOFXV]: 3,
  [GameType.Naruto]: 3,
};

// South African cities for arcade location
export const SA_CITIES = [
  'Johannesburg',
  'Cape Town',
  'Pretoria',
  'Durban',
  'Bloemfontein',
  'Port Elizabeth',
  'Polokwane',
  'East London',
  'Pietermaritzburg',
  'Vereeniging',
];

// Tournament format descriptions
export const FORMAT_INFO = {
  group_ko: {
    name: 'Group + Knockout',
    description: 'Players are placed in groups, then winners advance to a knockout stage.',
  },
  league: {
    name: 'League',
    description: 'Round-robin format where every player plays every other player.',
  },
  knockout: {
    name: 'Single Elimination',
    description: 'Bracket-style tournament. Lose once and you\'re out.',
  },
};
