import { Deal, DealStatus, isPositiveAmount, isDifferentParties } from "./types";
import { DomainError, ERR_ILLEGAL_TRANSITION, ERR_INVALID_DEAL } from "./errors";

// Canonical transition table (declarative)
const TRANSITIONS: Record<DealStatus, ReadonlyArray<DealStatus>> = {
  [DealStatus.INITIATED]: [DealStatus.FUNDED],
  [DealStatus.FUNDED]:    [DealStatus.RELEASED, DealStatus.DISPUTED],
  [DealStatus.RELEASED]:  [],                    // terminal
  [DealStatus.DISPUTED]:  [DealStatus.RELEASED, DealStatus.REFUNDED],
  [DealStatus.REFUNDED]:  []                     // terminal
};

export function isTransitionAllowed(from: DealStatus, to: DealStatus): boolean {
  return from === to || TRANSITIONS[from]?.includes(to) === true;
}

// Basic invariant checks — PURE
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

/** Pure: returns NEW deal with updated status; throws on illegal transition */
export function applyStatus(deal: Deal, next: DealStatus): Deal {
  if (!isTransitionAllowed(deal.status, next)) {
    throw new DomainError(
      ERR_ILLEGAL_TRANSITION,
      `Illegal transition ${deal.status} -> ${next}`
    );
  }
  return { ...deal, status: next };
}
