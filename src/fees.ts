// 1 Basis Point = 0.01%
const BPS_DIVISOR = 10000;

export interface FeeConfig {
  baseRateBps: number;      // e.g., 100 (1%)
  minFeeCents: number;      // e.g., 500 ($5.00)
  maxFeeCents: number;      // e.g., 100000 ($1000.00)
  affiliateShareBps: number; // e.g., 2000 (20% of the platform fee)
}

export interface PayoutDistribution {
  totalEscrow: bigint;
  platformNet: bigint;
  affiliateReward: bigint;
  sellerReceivable: bigint;
}

/**
 * Calculates the exact payout split for a completed deal.
 * Input: Total amount held in escrow.
 * Output: Who gets what.
 */
export function calculatePayouts(
  amountCents: bigint, 
  config: FeeConfig, 
  hasAffiliate: boolean
): PayoutDistribution {
  // 1. Calculate Gross Fee
  let fee = (amountCents * BigInt(config.baseRateBps)) / BigInt(BPS_DIVISOR);
  
  // 2. Clamp Fee (Min/Max)
  const min = BigInt(config.minFeeCents);
  const max = BigInt(config.maxFeeCents);
  if (fee < min) fee = min;
  if (fee > max) fee = max;

  // 3. Calculate Affiliate Split (if applicable)
  let affiliateReward = 0n;
  if (hasAffiliate) {
    affiliateReward = (fee * BigInt(config.affiliateShareBps)) / BigInt(BPS_DIVISOR);
  }

  // 4. Net Math
  const platformNet = fee - affiliateReward;
  const sellerReceivable = amountCents - fee; // Seller pays the fee from the gross

  return {
    totalEscrow: amountCents,
    platformNet,
    affiliateReward,
    sellerReceivable
  };
}
