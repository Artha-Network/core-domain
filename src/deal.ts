/**
 * @module deal
 * @description Core deal/escrow domain types and state transition logic
 */

/**
 * Deal lifecycle states matching onchain-escrow program
 */
export enum DealStatus {
  INIT = "INIT",           // Deal created, awaiting funding
  FUNDED = "FUNDED",       // Buyer has deposited funds
  DISPUTED = "DISPUTED",   // Either party raised a dispute
  RESOLVED = "RESOLVED",   // Arbiter made a decision
  RELEASED = "RELEASED",   // Funds released to seller
  REFUNDED = "REFUNDED",   // Funds returned to buyer
}

/**
 * Valid state transitions in the deal lifecycle
 */
const ALLOWED_TRANSITIONS: Record<DealStatus, DealStatus[]> = {
  [DealStatus.INIT]: [DealStatus.FUNDED],
  [DealStatus.FUNDED]: [DealStatus.DISPUTED, DealStatus.RELEASED, DealStatus.REFUNDED],
  [DealStatus.DISPUTED]: [DealStatus.RESOLVED],
  [DealStatus.RESOLVED]: [DealStatus.RELEASED, DealStatus.REFUNDED],
  [DealStatus.RELEASED]: [],
  [DealStatus.REFUNDED]: [],
};

/**
 * Deal entity structure
 */
export interface Deal {
  id: string;
  buyerWallet: string;
  sellerWallet: string;
  amount: number;
  status: DealStatus;
  createdAt: Date;
  updatedAt: Date;
  fundedAt?: Date;
  completedAt?: Date;
  disputedAt?: Date;
  escrowPda?: string;  // Onchain escrow PDA address
  description?: string;
}

/**
 * Check if a state transition is allowed
 * @param from Current deal status
 * @param to Target deal status
 * @returns true if transition is valid
 */
export function isTransitionAllowed(from: DealStatus, to: DealStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Validate deal state transition and throw if invalid
 * @param from Current deal status
 * @param to Target deal status
 * @throws Error if transition is not allowed
 */
export function assertTransition(from: DealStatus, to: DealStatus): void {
  if (!isTransitionAllowed(from, to)) {
    throw new Error(
      `Invalid deal state transition: ${from} -> ${to}. ` +
      `Allowed transitions from ${from}: ${ALLOWED_TRANSITIONS[from].join(", ")}`
    );
  }
}

/**
 * Check if a deal is in a terminal state (no further transitions)
 * @param status Deal status to check
 * @returns true if status is terminal
 */
export function isTerminalState(status: DealStatus): boolean {
  return ALLOWED_TRANSITIONS[status].length === 0;
}

/**
 * Check if a deal can be disputed in its current state
 * @param status Current deal status
 * @returns true if dispute is allowed
 */
export function canDispute(status: DealStatus): boolean {
  return status === DealStatus.FUNDED;
}

/**
 * Check if a deal requires arbiter intervention
 * @param status Current deal status
 * @returns true if arbiter action is needed
 */
export function requiresArbitration(status: DealStatus): boolean {
  return status === DealStatus.DISPUTED;
}

/**
 * Calculate deal age in milliseconds
 * @param deal Deal entity
 * @returns Age of deal in milliseconds
 */
export function getDealAge(deal: Deal): number {
  return Date.now() - deal.createdAt.getTime();
}

/**
 * Check if deal has timed out (default 30 days)
 * @param deal Deal entity
 * @param timeoutMs Timeout in milliseconds (default: 30 days)
 * @returns true if deal has exceeded timeout
 */
export function hasTimedOut(deal: Deal, timeoutMs: number = 30 * 24 * 60 * 60 * 1000): boolean {
  return getDealAge(deal) > timeoutMs;
}

/**
 * Get next possible states for a deal
 * @param currentStatus Current deal status
 * @returns Array of possible next states
 */
export function getNextStates(currentStatus: DealStatus): DealStatus[] {
  return ALLOWED_TRANSITIONS[currentStatus] || [];
}
