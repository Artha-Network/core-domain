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
