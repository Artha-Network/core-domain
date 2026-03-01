export enum OfferState {
  OPEN = "OPEN",
  COUNTERED = "COUNTERED",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  EXPIRED = "EXPIRED"
}

export interface Offer {
  id: string;
  amount: number;
  termsHash: string;
  createdAt: number;
  expiresAt: number;
}

/**
 * Determines the status of an offer at a specific point in time.
 */
export function getOfferStatus(offer: Offer, now = Date.now()): OfferState {
  if (now > offer.expiresAt) return OfferState.EXPIRED;
  return OfferState.OPEN;
}

/**
 * Logic to generate a valid counter-offer.
 * Rule: Counter-offer must be for the same terms hash, just different amount, 
 * and must reset the expiration timer.
 */
export function createCounterOffer(
  originalOffer: Offer, 
  newAmount: number, 
  durationSeconds: number
): Offer {
  if (getOfferStatus(originalOffer) === OfferState.ACCEPTED) {
    throw new Error("Cannot counter an accepted offer");
  }

  return {
    id: crypto.randomUUID(),
    amount: newAmount,
    termsHash: originalOffer.termsHash, // Terms must remain constant
    createdAt: Date.now(),
    expiresAt: Date.now() + (durationSeconds * 1000)
  };
}
