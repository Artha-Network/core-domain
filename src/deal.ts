import { Deal, DealStatus, isPositiveAmount, isDifferentParties } from "./types";
import { DomainError, ERR_ILLEGAL_TRANSITION, ERR_INVALID_DEAL } from "./errors";

/**
 * Deal state machine (pure, no I/O).
 *
 * States:
 *  - INITIATED  → buyer created the deal (not funded yet)
 *  - FUNDED     → escrow funded
 *  - DISPUTED   → a dispute was opened while funds are in escrow
 *  - RELEASED   → funds released to seller (terminal)
 *  - REFUNDED   → funds returned to buyer (terminal)
 *
 * Allowed transitions:
 *  INITIATED → FUNDED
 *  FUNDED    → RELEASED | DISPUTED
 *  DISPUTED  → RELEASED | REFUNDED
 *  RELEASED  → (none)
 *  REFUNDED  → (none)
 */

/** Canonical transition table (declarative, single source of truth). */
const TRANSITIONS: Record<DealStatus, ReadonlyArray<DealStatus>> = {
  [DealStatus.INITIATED]: [DealStatus.FUNDED],
  [DealStatus.FUNDED]:    [DealStatus.RELEASED, DealStatus.DISPUTED],
  [DealStatus.RELEASED]:  [], // terminal
  [DealStatus.DISPUTED]:  [DealStatus.RELEASED, DealStatus.REFUNDED],
  [DealStatus.REFUNDED]:  []  // terminal
};

/**
 * Returns whether a transition between two statuses is permitted by the
 * state machine. Idempotent calls (from === to) are treated as allowed.
 *
 * @example
 * isTransitionAllowed(DealStatus.FUNDED, DealStatus.DISPUTED) // true
 * isTransitionAllowed(DealStatus.INITIATED, DealStatus.RELEASED) // false
 */
export function isTransitionAllowed(from: DealStatus, to: DealStatus): boolean {
  return from === to || TRANSITIONS[from]?.includes(to) === true;
}

/**
 * Validates immutable deal invariants. Returns a list of DomainError;
 * returns an empty array when the deal is valid. This function never throws.
 *
 * Current checks:
 *  - amount > 0
 *  - buyer !== seller
 *
 * @example
 * const errs = validateDeal(deal);
 * if (errs.length) { /* surface to caller / log in caller *\/ }
 */
export function validateDeal(deal: Deal): DomainError[] {
  const errors: DomainError[] = [];
  if (!isPositiveAmount(deal.amount)) {
    errors.push(new DomainError(ERR_INVALID_DEAL, "Amount must be > 0"));
  }
  if (!isDifferentParties(deal.buyer, deal.seller)) {
    errors.push(new DomainError(ERR_INVALID_DEAL, "Buyer and seller must differ"));
  }
  return errors;
}

/**
 * Pure updater that applies a status transition and returns a NEW Deal object.
 * Throws DomainError(ERR_ILLEGAL_TRANSITION) if the transition is not allowed.
 *
 * @throws DomainError with code ERR_ILLEGAL_TRANSITION
 *
 * @example
 * const funded = applyStatus(deal, DealStatus.FUNDED);
 * const disputed = applyStatus(funded, DealStatus.DISPUTED);
 */
export function applyStatus(deal: Deal, next: DealStatus): Deal {
  if (!isTransitionAllowed(deal.status, next)) {
    throw new DomainError(
      ERR_ILLEGAL_TRANSITION,
      `Illegal transition ${deal.status} -> ${next}`
    );
  }
  return { ...deal, status: next };
}
