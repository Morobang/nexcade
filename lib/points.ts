/**
 * Season points calculation system for NexCade
 * Points are awarded based on tournament placement
 */

export interface PointsResult {
  placement: number;
  points: number;
  description: string;
}

/**
 * Points awarded per placement in tournaments
 * Based on a standard esports scoring system
 */
const PLACEMENT_POINTS = {
  1: 100, // 1st place (Champion)
  2: 60, // 2nd place (Runner-up)
  3: 40, // 3rd place (Bronze)
  4: 30,
  5: 20,
  6: 15,
  7: 12,
  8: 10,
  9: 8,
  10: 6,
  11: 5,
  12: 4,
  13: 3,
  14: 2,
  15: 1,
} as const;

/**
 * Participation points for registering in a tournament
 * Players get these points just for showing up
 */
const PARTICIPATION_POINTS = 10;

/**
 * Calculate points for a tournament placement
 * @param placement - The player's placement (1st, 2nd, etc.)
 * @returns Points awarded and description
 */
export function calculatePlacementPoints(placement: number): PointsResult {
  const points = PLACEMENT_POINTS[placement as keyof typeof PLACEMENT_POINTS] || 0;

  let description = '';
  if (placement === 1) {
    description = 'Champion!';
  } else if (placement === 2) {
    description = 'Runner-up';
  } else if (placement === 3) {
    description = 'Bronze medalist';
  } else {
    description = `${placement}${getOrdinalSuffix(placement)} place`;
  }

  return {
    placement,
    points,
    description,
  };
}

/**
 * Calculate total season points for a player from their results
 * @param results - Array of placement results
 */
export function calculateSeasonTotal(placements: number[]): number {
  return placements.reduce((total, placement) => {
    return total + calculatePlacementPoints(placement).points;
  }, 0);
}

/**
 * Calculate loyalty tier based on paid entries
 * Players earn 1 free entry after every 3 paid entries
 * @param paidEntries - Number of paid tournament entries
 */
export function calculateLoyaltyTier(paidEntries: number) {
  const freeEntries = Math.floor(paidEntries / 3);
  const tier = Math.floor(paidEntries / 5) + 1;

  const TIER_BENEFITS: Record<number, string> = {
    1: 'Standard player',
    2: 'Ranked badge on profile',
    3: 'Priority tournament registration',
    4: 'Exclusive Discord channel',
    5: 'Special tournament seeding',
  };

  return {
    tier,
    totalPaid: paidEntries,
    freeEntriesEarned: freeEntries,
    nextFreeEntryAt: ((freeEntries + 1) * 3) - paidEntries,
    benefits: TIER_BENEFITS[tier] || 'Special player benefits',
  };
}

/**
 * Get all season milestones (achievements) for a player
 * @param totalPoints - Player's total season points
 * @param totalWins - Number of tournament wins
 */
export function getSeasonMilestones(totalPoints: number, totalWins: number) {
  const milestones = [];

  if (totalWins >= 1) milestones.push('First Champion');
  if (totalWins >= 3) milestones.push('Rising Star');
  if (totalWins >= 5) milestones.push('Tournament Dominator');
  if (totalWins >= 10) milestones.push('Legend Status');

  if (totalPoints >= 100) milestones.push('100 Point Club');
  if (totalPoints >= 500) milestones.push('500 Point Club');
  if (totalPoints >= 1000) milestones.push('1000 Point Club');

  return milestones;
}

/**
 * Compare two players for leaderboard ranking
 * Used for sorting players on the leaderboard
 * @param playerA - First player's stats
 * @param playerB - Second player's stats
 */
export function compareLeaderboardRank(playerA: {
  totalPoints: number;
  wins: number;
}, playerB: {
  totalPoints: number;
  wins: number;
}): number {
  // Primary sort: total points (descending)
  if (playerA.totalPoints !== playerB.totalPoints) {
    return playerB.totalPoints - playerA.totalPoints;
  }

  // Secondary sort: wins (descending)
  return playerB.wins - playerA.wins;
}

/**
 * Calculate season end date (3 months from now)
 * Seasons run quarterly
 */
export function getSeasonEndDate(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());
}

/**
 * Get current season name (Q1, Q2, Q3, Q4)
 */
export function getCurrentSeasonName(): string {
  const month = new Date().getMonth();
  const quarter = Math.floor(month / 3) + 1;
  const year = new Date().getFullYear();
  return `S${year}Q${quarter}`;
}

/**
 * Get ordinal suffix for numbers (1st, 2nd, 3rd, 4th, etc.)
 */
function getOrdinalSuffix(num: number): string {
  const j = num % 10;
  const k = num % 100;

  if (j === 1 && k !== 11) {
    return 'st';
  }
  if (j === 2 && k !== 12) {
    return 'nd';
  }
  if (j === 3 && k !== 13) {
    return 'rd';
  }

  return 'th';
}

/**
 * Get placement badge color for UI rendering
 * @param placement - Tournament placement
 */
export function getPlacementBadgeColor(placement: number): string {
  if (placement === 1) return '#FFD700'; // Gold
  if (placement === 2) return '#C0C0C0'; // Silver
  if (placement === 3) return '#CD7F32'; // Bronze
  return '#6B7280'; // Gray
}

/**
 * Get placement badge emoji
 * @param placement - Tournament placement
 */
export function getPlacementEmoji(placement: number): string {
  if (placement === 1) return '🥇';
  if (placement === 2) return '🥈';
  if (placement === 3) return '🥉';
  return '🎯';
}
