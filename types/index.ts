// Game types
export enum GameType {
  FC26 = 'FC26',
  Tekken8 = 'Tekken8',
  SF6 = 'SF6',
  MK1 = 'MK1',
  KOFXV = 'KOFXV',
  Naruto = 'Naruto',
}

// Tournament format
export enum TournamentFormat {
  GroupKO = 'group_ko',
  League = 'league',
  Knockout = 'knockout',
}

// Tournament status
export enum TournamentStatus {
  Open = 'open',
  Full = 'full',
  Live = 'live',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

// Registration status
export enum RegistrationStatus {
  Registered = 'registered',
  Paid = 'paid',
  CheckedIn = 'checked_in',
  Cancelled = 'cancelled',
}

// Payment status
export enum PaymentStatus {
  Pending = 'pending',
  Paid = 'paid',
  Refunded = 'refunded',
}

// User role
export enum UserRole {
  Player = 'player',
  ArcadeOwner = 'arcade_owner',
  PlatformAdmin = 'platform_admin',
}

// User/Player Profile
export interface Profile {
  id: string;
  full_name: string;
  gamer_tag: string;
  email: string;
  role: UserRole;
  phone?: string;
  psn_id?: string;
  home_arcade_id?: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}

// Arcade
export interface Arcade {
  id: string;
  owner_id?: string;
  name: string;
  slug: string;
  city: string;
  address?: string;
  description?: string;
  contact_email?: string;
  whatsapp_number?: string;
  logo_url?: string;
  cover_url?: string;
  games_supported: string[];
  console_setup?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Tournament
export interface Tournament {
  id: string;
  arcade_id: string;
  name: string;
  slug: string;
  game_type: GameType;
  format: TournamentFormat;
  status: TournamentStatus;
  is_qualifier?: boolean;
  description?: string;
  rules?: string;
  start_at: string;
  end_at?: string;
  entry_fee: number;
  prize_pool: number;
  max_players: number;
  is_streamed: boolean;
  stream_url?: string;
  venue?: string;
  registration_deadline?: string;
  created_at: string;
  updated_at: string;
}

// Registration
export interface Registration {
  id: string;
  tournament_id: string;
  profile_id: string;
  registration_status: RegistrationStatus;
  payment_status: PaymentStatus;
  booking_ref: string;
  team_name?: string;
  team_type?: string;
  character_1?: string;
  character_2?: string;
  character_3?: string;
  support_character?: string;
  rules_agreed: boolean;
  registered_at: string;
  paid_at?: string;
  checked_in_at?: string;
  created_at: string;
  updated_at: string;
}

// Result
export interface Result {
  id: string;
  tournament_id: string;
  profile_id: string;
  placement: number;
  is_winner: boolean;
  points_awarded: number;
  result_data?: Record<string, any>;
  recorded_at: string;
  created_at: string;
  updated_at: string;
}

// Season Points
export interface SeasonPoints {
  id: string;
  profile_id: string;
  tournament_id: string;
  season: string;
  points: number;
  is_season_champion?: boolean;
  created_at: string;
  updated_at: string;
}

// Arcade Sponsor
export interface ArcadeSponsor {
  id: string;
  arcade_id: string;
  sponsor_name: string;
  sponsor_logo_url?: string;
  website_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// News Post
export interface NewsPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  category?: string;
  cover_image_url?: string;
  author_id?: string;
  published_at?: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

// Extended types for frontend use

// Arcade with owner details
export interface ArcadeWithOwner extends Arcade {
  owner?: Profile;
}

// Tournament with arcade details
export interface TournamentWithArcade extends Tournament {
  arcade?: Arcade;
}

// Registration with profile and tournament details
export interface RegistrationWithDetails extends Registration {
  profile?: Profile;
  tournament?: Tournament;
}

// Player stats for leaderboard/dashboard
export interface PlayerStats {
  profile_id: string;
  tournaments_played: number;
  wins: number;
  placements: number[];
  win_rate: number;
  total_season_points: number;
  loyalty_tier: number;
  free_entries_earned: number;
}

// Bracket node for tournament bracket display
export interface BracketNode {
  id: string;
  player_1?: Profile;
  player_2?: Profile;
  winner?: Profile;
  next_node_id?: string;
  is_finals?: boolean;
}
