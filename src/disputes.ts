import { z } from "zod";

export enum DisputeReason {
  NON_DELIVERY = "NON_DELIVERY",
  NOT_AS_DESCRIBED = "NOT_AS_DESCRIBED",
  DAMAGED_GOODS = "DAMAGED_GOODS",
  SERVICE_INCOMPLETE = "SERVICE_INCOMPLETE"
}

export enum ResolutionOutcome {
  BUYER_WINS = "BUYER_WINS",
  SELLER_WINS = "SELLER_WINS",
  SPLIT_50_50 = "SPLIT_50_50",
  ESCALATE_TO_JURY = "ESCALATE_TO_JURY"
}

export const DisputeClaimSchema = z.object({
  claimantId: z.string(),
  reason: z.nativeEnum(DisputeReason),
  description: z.string().min(20),
  evidenceCount: z.number().min(0),
  requestedRefundPercentage: z.number().min(0).max(100)
});

export type DisputeClaim = z.infer<typeof DisputeClaimSchema>;

/**
 * Pure function to determine the initial outcome based on claims.
 * Encodes the business rules for auto-arbitration.
 */
export function calculatePreliminaryOutcome(
  buyerClaim: DisputeClaim, 
  sellerClaim: DisputeClaim,
  dealValue: number
): ResolutionOutcome {
  // Rule 1: High Value Protection
  // If deal is over $10,000, always escalate to human jury
  if (dealValue > 10000) {
    return ResolutionOutcome.ESCALATE_TO_JURY;
  }

  // Rule 2: Non-Delivery Default
  // If buyer claims non-delivery and seller has 0 evidence, Buyer wins
  if (buyerClaim.reason === DisputeReason.NON_DELIVERY && sellerClaim.evidenceCount === 0) {
    return ResolutionOutcome.BUYER_WINS;
  }

  // Rule 3: Amicable Split
  // If both parties ask for roughly 50% (within 5% margin), split it
  if (Math.abs(buyerClaim.requestedRefundPercentage - 50) < 5 && 
      Math.abs(sellerClaim.requestedRefundPercentage - 50) < 5) {
    return ResolutionOutcome.SPLIT_50_50;
  }

  // Default: Complex cases go to jury
  return ResolutionOutcome.ESCALATE_TO_JURY;
}
