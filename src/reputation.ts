// Simple v1 reputation score (0–100), pure function.

export type RepInput = {
  completed: number;  // successful releases
  refunded: number;   // seller refunds
  disputes: number;   // total disputes (any outcome)
};

export function reputationScore({ completed, refunded, disputes }: RepInput): number {
  // Rewards completions, penalizes refunds more than disputes.
  const reward = Math.min(completed * 5, 80);    // cap base reward at 80
  const penalty = refunded * 10 + disputes * 5;  // heavier hit for refunds
  const raw = reward - penalty;
  return Math.max(0, Math.min(100, raw));
}
