/**
 * @module reputation
 * @description User reputation scoring and validation logic
 */

/**
 * Reputation score breakdown
 */
export interface ReputationScore {
  total: number;              // Overall reputation score (0-1000)
  dealsCompleted: number;     // Number of successfully completed deals
  dealsFailed: number;        // Number of failed/refunded deals
  disputesRaised: number;     // Number of disputes initiated
  disputesWon: number;        // Number of disputes won
  disputesLost: number;       // Number of disputes lost
  averageResponseTime: number; // Average response time in hours
  accountAge: number;         // Account age in days
}

/**
 * Reputation tier levels
 */
export enum ReputationTier {
  NEW = "NEW",           // 0-100 score
  BRONZE = "BRONZE",     // 101-300 score
  SILVER = "SILVER",     // 301-600 score
  GOLD = "GOLD",         // 601-850 score
  PLATINUM = "PLATINUM", // 851-1000 score
}

/**
 * Calculate base reputation score from deal history
 * @param completed Number of completed deals
 * @param failed Number of failed deals
 * @returns Base score (0-500)
 */
export function calculateDealScore(completed: number, failed: number): number {
  const successRate = completed / Math.max(1, completed + failed);
  const volumeBonus = Math.min(completed * 5, 200); // Max 200 bonus for volume
  return Math.floor(successRate * 300 + volumeBonus);
}

/**
 * Calculate dispute score impact
 * @param raised Number of disputes raised
 * @param won Number of disputes won
 * @param lost Number of disputes lost
 * @returns Dispute score (-200 to +100)
 */
export function calculateDisputeScore(
  raised: number,
  won: number,
  lost: number
): number {
  if (raised === 0) return 50; // Bonus for no disputes
  
  const winRate = won / raised;
  const lossRate = lost / raised;
  
  // Penalty for losing disputes is higher than reward for winning
  const winBonus = winRate * 100;
  const lossPenalty = lossRate * 200;
  
  return Math.floor(winBonus - lossPenalty);
}

/**
 * Calculate responsiveness score
 * @param avgResponseHours Average response time in hours
 * @returns Responsiveness score (0-100)
 */
export function calculateResponsivenessScore(avgResponseHours: number): number {
  if (avgResponseHours <= 1) return 100;
  if (avgResponseHours <= 6) return 80;
  if (avgResponseHours <= 24) return 60;
  if (avgResponseHours <= 48) return 40;
  return 20;
}

/**
 * Calculate account age bonus
 * @param accountAgeDays Account age in days
 * @returns Age bonus (0-100)
 */
export function calculateAgeBonusScore(accountAgeDays: number): number {
  // Logarithmic growth: significant early bonus, diminishing returns
  if (accountAgeDays < 7) return 0;
  if (accountAgeDays < 30) return 20;
  if (accountAgeDays < 90) return 40;
  if (accountAgeDays < 180) return 60;
  if (accountAgeDays < 365) return 80;
  return 100;
}

/**
 * Calculate total reputation score
 * @param stats Reputation score breakdown
 * @returns Total reputation score (0-1000)
 */
export function calculateTotalReputation(stats: Omit<ReputationScore, 'total'>): number {
  const dealScore = calculateDealScore(stats.dealsCompleted, stats.dealsFailed);
  const disputeScore = calculateDisputeScore(
    stats.disputesRaised,
    stats.disputesWon,
    stats.disputesLost
  );
  const responsivenessScore = calculateResponsivenessScore(stats.averageResponseTime);
  const ageBonus = calculateAgeBonusScore(stats.accountAge);

  const total = dealScore + disputeScore + responsivenessScore + ageBonus;
  
  // Clamp between 0 and 1000
  return Math.max(0, Math.min(1000, total));
}

/**
 * Get reputation tier from score
 * @param score Total reputation score
 * @returns Reputation tier
 */
export function getReputationTier(score: number): ReputationTier {
  if (score >= 851) return ReputationTier.PLATINUM;
  if (score >= 601) return ReputationTier.GOLD;
  if (score >= 301) return ReputationTier.SILVER;
  if (score >= 101) return ReputationTier.BRONZE;
  return ReputationTier.NEW;
}

/**
 * Check if user is trusted (Gold tier or higher)
 * @param score Total reputation score
 * @returns true if user is in Gold or Platinum tier
 */
export function isTrustedUser(score: number): boolean {
  return score >= 601;
}

/**
 * Calculate required deals for next tier
 * @param currentScore Current reputation score
 * @returns Object with next tier and deals needed
 */
export function getProgressToNextTier(currentScore: number): {
  currentTier: ReputationTier;
  nextTier: ReputationTier | null;
  pointsNeeded: number;
} {
  const currentTier = getReputationTier(currentScore);
  
  const thresholds: Record<ReputationTier, { next: ReputationTier | null; threshold: number }> = {
    [ReputationTier.NEW]: { next: ReputationTier.BRONZE, threshold: 101 },
    [ReputationTier.BRONZE]: { next: ReputationTier.SILVER, threshold: 301 },
    [ReputationTier.SILVER]: { next: ReputationTier.GOLD, threshold: 601 },
    [ReputationTier.GOLD]: { next: ReputationTier.PLATINUM, threshold: 851 },
    [ReputationTier.PLATINUM]: { next: null, threshold: 1000 },
  };

  const { next, threshold } = thresholds[currentTier];
  const pointsNeeded = next ? threshold - currentScore : 0;

  return {
    currentTier,
    nextTier: next,
    pointsNeeded,
  };
}

/**
 * Validate if user meets minimum reputation requirement
 * @param score User's reputation score
 * @param minRequired Minimum required score
 * @returns Validation result
 */
export function meetsMinimumReputation(
  score: number,
  minRequired: number = 100
): { valid: boolean; error?: string } {
  if (score >= minRequired) {
    return { valid: true };
  }
  
  const pointsShort = minRequired - score;
  return {
    valid: false,
    error: `Reputation too low. Need ${pointsShort} more points to meet minimum of ${minRequired}`,
  };
}
