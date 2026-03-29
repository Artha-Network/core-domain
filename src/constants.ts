/**
 * Protocol-wide constants for Artha Network
 *
 * Centralizes magic numbers and limits referenced across services.
 * All values are deterministic and safe to share between client and server.
 */

// ── USDC Token ──────────────────────────────────────────────────────────
export const USDC_DECIMALS = 6;
export const USDC_MULTIPLIER = 10 ** USDC_DECIMALS; // 1_000_000

// ── Deal Amount Limits ──────────────────────────────────────────────────
/** Minimum deal amount in USDC (human-readable) */
export const MIN_DEAL_AMOUNT_USDC = 1;
/** Maximum deal amount in USDC (human-readable) */
export const MAX_DEAL_AMOUNT_USDC = 1_000_000;
/** Minimum deal amount in lamports (on-chain) */
export const MIN_DEAL_AMOUNT_LAMPORTS = BigInt(MIN_DEAL_AMOUNT_USDC) * BigInt(USDC_MULTIPLIER);
/** Maximum deal amount in lamports (on-chain) */
export const MAX_DEAL_AMOUNT_LAMPORTS = BigInt(MAX_DEAL_AMOUNT_USDC) * BigInt(USDC_MULTIPLIER);

// ── Fee Structure ───────────────────────────────────────────────────────
/** Maximum basis points (100%) */
export const MAX_BPS = 10_000;
/** Default platform fee in basis points (2.5%) */
export const DEFAULT_PLATFORM_FEE_BPS = 250;
/** Maximum allowed fee in basis points (10%) */
export const MAX_PLATFORM_FEE_BPS = 1_000;
/** Minimum fee for micro-deals in lamports */
export const MIN_FEE_FLOOR_LAMPORTS = BigInt(10_000); // 0.01 USDC

// ── Time Windows ────────────────────────────────────────────────────────
/** Default dispute window in seconds (7 days) */
export const DEFAULT_DISPUTE_WINDOW_SEC = 7 * 24 * 60 * 60;
/** Minimum dispute window in seconds (1 hour) */
export const MIN_DISPUTE_WINDOW_SEC = 60 * 60;
/** Maximum dispute window in seconds (30 days) */
export const MAX_DISPUTE_WINDOW_SEC = 30 * 24 * 60 * 60;
/** Deal timeout after which it can be auto-expired (30 days) */
export const DEAL_TIMEOUT_SEC = 30 * 24 * 60 * 60;
/** Evidence submission deadline after dispute (48 hours) */
export const EVIDENCE_DEADLINE_SEC = 48 * 60 * 60;
/** Escalation threshold: auto-escalate if unresolved (48 hours) */
export const ESCALATION_THRESHOLD_SEC = 48 * 60 * 60;

// ── Evidence Limits ─────────────────────────────────────────────────────
/** Maximum evidence items per party per dispute */
export const MAX_EVIDENCE_PER_PARTY = 10;
/** Maximum total evidence size per party (100 MB) */
export const MAX_EVIDENCE_TOTAL_BYTES = 100 * 1024 * 1024;

// ── Reputation ──────────────────────────────────────────────────────────
/** Maximum reputation score */
export const MAX_REPUTATION_SCORE = 1000;
/** Minimum reputation score */
export const MIN_REPUTATION_SCORE = 0;
/** Reputation tier thresholds */
export const REPUTATION_THRESHOLDS = {
  NEW: 0,
  BRONZE: 101,
  SILVER: 301,
  GOLD: 601,
  PLATINUM: 851,
} as const;
/** Minimum reputation to be considered "trusted" */
export const TRUSTED_USER_THRESHOLD = REPUTATION_THRESHOLDS.GOLD;

// ── Risk Assessment ─────────────────────────────────────────────────────
/** Maximum risk score */
export const MAX_RISK_SCORE = 100;
/** High risk threshold */
export const HIGH_RISK_THRESHOLD = 60;
/** Medium risk threshold */
export const MEDIUM_RISK_THRESHOLD = 30;
/** Recommended hold times by risk level (ms) */
export const HOLD_TIMES_MS = {
  low: 1 * 24 * 60 * 60 * 1000,
  medium: 3 * 24 * 60 * 60 * 1000,
  high: 7 * 24 * 60 * 60 * 1000,
} as const;

// ── Solana ──────────────────────────────────────────────────────────────
/** PDA seed for escrow state accounts */
export const ESCROW_PDA_SEED = "escrow";
/** PDA seed for vault authority */
export const VAULT_PDA_SEED = "vault";
/** Devnet USDC mint address */
export const DEVNET_USDC_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

// ── Notifications ───────────────────────────────────────────────────────
/** Polling interval for active deals (ms) */
export const DEAL_POLL_INTERVAL_MS = 15_000;
/** Maximum unread notifications before auto-dismiss */
export const MAX_UNREAD_NOTIFICATIONS = 50;

// ── Validation Patterns ─────────────────────────────────────────────────
/** Solana base58 address regex */
export const BASE58_PATTERN = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
/** UUID v4 pattern */
export const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
/** IPFS CID v0 pattern */
export const CID_V0_PATTERN = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
/** IPFS CID v1 pattern */
export const CID_V1_PATTERN = /^b[a-z2-7]{58,}$/;
