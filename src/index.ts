/**
 * @trust-escrow/core-domain
 * 
 * Pure TypeScript domain models and business logic helpers.
 * No I/O operations - suitable for sharing across all services.
 * 
 * @module core-domain
 */

// Deal management
export {
  DealStatus,
  type Deal,
  isTransitionAllowed,
  assertTransition,
  isTerminalState,
  canDispute,
  requiresArbitration,
  getDealAge,
  hasTimedOut,
  getNextStates,
} from "./deal";

// Dispute handling
export {
  DisputeOutcome,
  EvidenceType,
  type Evidence,
  type Dispute,
  isValidCID,
  isValidEvidenceSize,
  requiresSpecialHandling,
  getTotalEvidenceSize,
  hasBilateralEvidence,
  isResolved,
  getDisputeAgeHours,
  requiresEscalation,
  validateEvidenceSubmission,
} from "./dispute";

// Reputation system
export {
  ReputationTier,
  type ReputationScore,
  calculateDealScore,
  calculateDisputeScore,
  calculateResponsivenessScore,
  calculateAgeBonusScore,
  calculateTotalReputation,
  getReputationTier,
  isTrustedUser,
  getProgressToNextTier,
  meetsMinimumReputation,
} from "./reputation";

// Evidence validation
export {
  MAX_FILE_SIZES,
  ALLOWED_MIME_TYPES,
  type CIDValidation,
  validateCID,
  validateEvidenceFileSize,
  isAllowedMimeType,
  getIPFSGatewayURL,
  getArweaveGatewayURL,
  extractCIDFromURL,
  validateEvidenceList,
  formatFileSize,
  buildPinCheckURL,
} from "./evidence";

// Risk assessment
export {
  type RiskLevel,
  type DealCategory,
  type RiskInput,
  type RiskAssessment,
  assessRisk,
} from "./risk";

// Protocol constants
export {
  USDC_DECIMALS,
  USDC_MULTIPLIER,
  MIN_DEAL_AMOUNT_USDC,
  MAX_DEAL_AMOUNT_USDC,
  MIN_DEAL_AMOUNT_LAMPORTS,
  MAX_DEAL_AMOUNT_LAMPORTS,
  MAX_BPS,
  DEFAULT_PLATFORM_FEE_BPS,
  MAX_PLATFORM_FEE_BPS,
  DEFAULT_DISPUTE_WINDOW_SEC,
  MIN_DISPUTE_WINDOW_SEC,
  MAX_DISPUTE_WINDOW_SEC,
  DEAL_TIMEOUT_SEC,
  EVIDENCE_DEADLINE_SEC,
  ESCALATION_THRESHOLD_SEC,
  MAX_EVIDENCE_PER_PARTY,
  MAX_EVIDENCE_TOTAL_BYTES,
  MAX_REPUTATION_SCORE,
  REPUTATION_THRESHOLDS,
  TRUSTED_USER_THRESHOLD,
  MAX_RISK_SCORE,
  HIGH_RISK_THRESHOLD,
  MEDIUM_RISK_THRESHOLD,
  HOLD_TIMES_MS,
  ESCROW_PDA_SEED,
  VAULT_PDA_SEED,
  DEVNET_USDC_MINT,
  DEAL_POLL_INTERVAL_MS,
  BASE58_PATTERN,
  UUID_V4_PATTERN,
  CID_V0_PATTERN,
  CID_V1_PATTERN,
} from "./constants";

// Input validation
export {
  SOLANA_ADDRESS_LENGTH,
  BASE58_REGEX,
  validateWalletAddress,
  validateUSDCAmount,
  validateDealDescription,
  isValidUUID,
  validateTxSignature,
  sanitizeInput,
  validateEmail,
  validateDisputeReason,
  validateDealCreation,
  type DealCreationInput,
} from "./validation";
