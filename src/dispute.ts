/**
 * @module dispute
 * @description Dispute lifecycle and evidence management helpers
 */

/**
 * Dispute resolution outcomes
 */
export enum DisputeOutcome {
  PENDING = "PENDING",           // Dispute raised, awaiting review
  BUYER_WINS = "BUYER_WINS",     // Arbiter ruled in favor of buyer (refund)
  SELLER_WINS = "SELLER_WINS",   // Arbiter ruled in favor of seller (release)
  SPLIT = "SPLIT",               // Partial refund/release
  ESCALATED = "ESCALATED",       // Escalated to human review
}

/**
 * Evidence types supported by the system
 */
export enum EvidenceType {
  TEXT = "TEXT",               // Text description
  IMAGE = "IMAGE",             // Image file
  DOCUMENT = "DOCUMENT",       // PDF, DOC, etc.
  VIDEO = "VIDEO",             // Video file
  CHAT_LOG = "CHAT_LOG",       // Chat conversation export
  TRANSACTION = "TRANSACTION", // Blockchain transaction proof
  OTHER = "OTHER",             // Other evidence type
}

/**
 * Evidence item structure
 */
export interface Evidence {
  id: string;
  dealId: string;
  submittedBy: "buyer" | "seller";
  type: EvidenceType;
  cid: string;           // IPFS/Arweave CID
  description?: string;
  sizeBytes?: number;
  submittedAt: Date;
}

/**
 * Dispute entity structure
 */
export interface Dispute {
  id: string;
  dealId: string;
  raisedBy: "buyer" | "seller";
  reason: string;
  outcome: DisputeOutcome;
  evidences: Evidence[];
  arbiterNotes?: string;
  createdAt: Date;
  resolvedAt?: Date;
  resolutionTxSignature?: string;  // Onchain resolution transaction
}

/**
 * Validate IPFS CID format (basic check)
 * @param cid IPFS CID string
 * @returns true if CID format is valid
 */
export function isValidCID(cid: string): boolean {
  // Basic CIDv0 (Qm...) or CIDv1 (b...) validation
  return /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[a-z2-7]{58})$/i.test(cid);
}

/**
 * Validate evidence file size (max 50MB)
 * @param sizeBytes File size in bytes
 * @param maxSizeBytes Maximum allowed size (default: 50MB)
 * @returns true if size is within limit
 */
export function isValidEvidenceSize(
  sizeBytes: number,
  maxSizeBytes: number = 50 * 1024 * 1024
): boolean {
  return sizeBytes > 0 && sizeBytes <= maxSizeBytes;
}

/**
 * Check if evidence type requires special handling
 * @param type Evidence type
 * @returns true if type needs validation/processing
 */
export function requiresSpecialHandling(type: EvidenceType): boolean {
  return [EvidenceType.VIDEO, EvidenceType.DOCUMENT].includes(type);
}

/**
 * Calculate total evidence size for a dispute
 * @param evidences Array of evidence items
 * @returns Total size in bytes
 */
export function getTotalEvidenceSize(evidences: Evidence[]): number {
  return evidences.reduce((sum, e) => sum + (e.sizeBytes || 0), 0);
}

/**
 * Check if dispute has sufficient evidence from both parties
 * @param dispute Dispute entity
 * @returns true if both parties have submitted evidence
 */
export function hasBilateralEvidence(dispute: Dispute): boolean {
  const buyerEvidence = dispute.evidences.some(e => e.submittedBy === "buyer");
  const sellerEvidence = dispute.evidences.some(e => e.submittedBy === "seller");
  return buyerEvidence && sellerEvidence;
}

/**
 * Check if dispute is resolved
 * @param outcome Dispute outcome
 * @returns true if outcome is terminal
 */
export function isResolved(outcome: DisputeOutcome): boolean {
  return outcome !== DisputeOutcome.PENDING && outcome !== DisputeOutcome.ESCALATED;
}

/**
 * Get dispute age in hours
 * @param dispute Dispute entity
 * @returns Age in hours
 */
export function getDisputeAgeHours(dispute: Dispute): number {
  return (Date.now() - dispute.createdAt.getTime()) / (1000 * 60 * 60);
}

/**
 * Check if dispute requires escalation (>48 hours without resolution)
 * @param dispute Dispute entity
 * @param hoursThreshold Hours before escalation (default: 48)
 * @returns true if escalation is needed
 */
export function requiresEscalation(dispute: Dispute, hoursThreshold: number = 48): boolean {
  if (dispute.outcome !== DisputeOutcome.PENDING) return false;
  return getDisputeAgeHours(dispute) > hoursThreshold;
}

/**
 * Validate evidence submission by party
 * @param dispute Dispute entity
 * @param submittedBy Party submitting evidence
 * @returns Validation result with error message if invalid
 */
export function validateEvidenceSubmission(
  dispute: Dispute,
  submittedBy: "buyer" | "seller"
): { valid: boolean; error?: string } {
  if (isResolved(dispute.outcome)) {
    return { valid: false, error: "Cannot submit evidence to resolved dispute" };
  }

  const partyEvidence = dispute.evidences.filter(e => e.submittedBy === submittedBy);
  if (partyEvidence.length >= 10) {
    return { valid: false, error: "Maximum 10 evidence items per party" };
  }

  const totalSize = getTotalEvidenceSize(partyEvidence);
  if (totalSize > 100 * 1024 * 1024) {
    return { valid: false, error: "Total evidence size exceeds 100MB limit" };
  }

  return { valid: true };
}
