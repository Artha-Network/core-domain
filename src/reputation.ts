/**
 * Simple v1 reputation score (0–100).
 *
 * Heuristic only:
 * - Rewards completed deals.
 * - Penalizes refunds more than generic disputes.
 * - Clamped to [0, 100] for UI consistency.
 *
 * NOTE: This is pure math; no persistence or time decay here.
 *       Tune weights in future versions.
 */

export type RepInput = {
  /** Number of successful releases (completed deals). */
  completed: number;
  /** Count of refunds against the seller (heavier penalty). */
  refunded: number;
  /** Total disputes (any outcome). */
  disputes: number;
};

/**
 * Computes a 0–100 reputation score.
 *
 * Formula (v1):
 *   reward  = min(completed * 5, 80)
 *   penalty = refunded * 10 + disputes * 5
 *   score   = clamp(reward - penalty, 0, 100)
 *
 * @example
 * reputationScore({ completed: 10, refunded: 1, disputes: 2 }) // → 40
 */
export function reputationScore({ completed, refunded, disputes }: RepInput): number {
  // Rewards completions; caps base reward to avoid runaway scores.
  const reward = Math.min(completed * 5, 80);

  // Heavier hit for refunds than for disputes.
  const penalty = refunded * 10 + disputes * 5;

  // Clamp to [0, 100] for stable consumer logic.
  const raw = reward - penalty;
  return Math.max(0, Math.min(100, raw));
}
