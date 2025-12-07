// src/risk.ts
// Pure domain-level risk assessment for escrow deals.
// No I/O, no external deps.

export type DealCategory = "digital" | "physical" | "service";

export type RiskLevel = "low" | "medium" | "high";

export interface RiskInput {
  /** Deal amount in smallest units (lamports / wei / cents, etc.). */
  amount: bigint;

  /** Buyer reputation score (0–100, higher = better). */
  buyerReputation: number;

  /** Seller reputation score (0–100, higher = better). */
  sellerReputation: number;

  /** Number of prior disputes between this buyer + seller. */
  priorDisputesBetweenPair: number;

  /** Broad category of the item/service. */
  category: DealCategory;
}

export interface RiskAssessment {
  /** 0–100, higher = more risk. */
  score: number;
  level: RiskLevel;
  /** Recommended minimum escrow hold time in milliseconds. */
  recommendedHoldMs: number;
}

/**
 * Clamp helper (0–100) and integer score.
 */
function clampScore(value: number): number {
  if (Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return Math.round(value);
}

/**
 * High-level, explainable risk scoring model.
 * Designed so you can change the weights later without touching callers.
 */
export function assessRisk(input: RiskInput): RiskAssessment {
  const {
    amount,
    buyerReputation,
    sellerReputation,
    priorDisputesBetweenPair,
    category,
  } = input;

  const absAmount = amount < 0n ? -amount : amount;

  let score = 0;

  // 1) Amount at risk (max ~30 pts)
  if (absAmount >= 10_000_000n) {
    score += 30;
  } else if (absAmount >= 1_000_000n) {
    score += 20;
  } else if (absAmount >= 100_000n) {
    score += 10;
  } else if (absAmount > 0n) {
    score += 5;
  }

  // 2) Counterparty quality (max ~40 pts)
  const avgReputation = (buyerReputation + sellerReputation) / 2;
  // Low reputation => higher risk. Scale 0–100 rep into 0–40 risk.
  const reputationRisk = ((100 - avgReputation) / 100) * 40;
  score += reputationRisk;

  // 3) Relationship history (max ~20 pts)
  if (priorDisputesBetweenPair > 0) {
    // First few disputes add more penalty, then taper off.
    const capped = Math.min(priorDisputesBetweenPair, 5);
    score += capped * 4; // up to 20 pts
  }

  // 4) Category-specific tweaks (max ~10 pts)
  switch (category) {
    case "physical":
      // shipping & damage risk
      score += 7;
      break;
    case "service":
      // expectation mismatch risk
      score += 5;
      break;
    case "digital":
      // usually fewer logistics issues
      score += 3;
      break;
    default:
      // if caller passes something unexpected
      score += 5;
      break;
  }

  const finalScore = clampScore(score);

  let level: RiskLevel;
  if (finalScore <= 30) level = "low";
  else if (finalScore <= 60) level = "medium";
  else level = "high";

  // Recommended minimum hold time based on risk band.
  const recommendedHoldMs =
    level === "high"
      ? 7 * 24 * 60 * 60 * 1000 // 7 days
      : level === "medium"
      ? 3 * 24 * 60 * 60 * 1000 // 3 days
      : 24 * 60 * 60 * 1000; // 1 day

  return {
    score: finalScore,
    level,
    recommendedHoldMs,
  };
}

/**
 * Convenience predicate to gate features (instant release, fast-path, etc.)
 */
export function isHighRisk(assessment: RiskAssessment): boolean {
  return assessment.level === "high";
}
