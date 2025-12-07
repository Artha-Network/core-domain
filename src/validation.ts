/**
 * @module validation
 * @description Input validation helpers for Artha Network escrow system
 */

/**
 * Solana wallet address validation
 */
export const SOLANA_ADDRESS_LENGTH = 44;
export const BASE58_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

/**
 * Validate Solana wallet address
 * @param address Wallet address string
 * @returns Validation result
 */
export function validateWalletAddress(address: string): {
  valid: boolean;
  error?: string;
} {
  if (!address || typeof address !== "string") {
    return { valid: false, error: "Wallet address must be a non-empty string" };
  }

  if (address.length < 32 || address.length > 44) {
    return { valid: false, error: "Invalid wallet address length" };
  }

  if (!BASE58_REGEX.test(address)) {
    return { valid: false, error: "Wallet address contains invalid characters" };
  }

  return { valid: true };
}

/**
 * Validate USDC amount (must be positive with max 6 decimals)
 * @param amount Amount string or number
 * @returns Validation result
 */
export function validateUSDCAmount(amount: string | number): {
  valid: boolean;
  error?: string;
  value?: number;
} {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    return { valid: false, error: "Amount must be a valid number" };
  }

  if (numAmount <= 0) {
    return { valid: false, error: "Amount must be greater than 0" };
  }

  if (numAmount > 1_000_000) {
    return { valid: false, error: "Amount exceeds maximum limit of 1,000,000 USDC" };
  }

  // Check for max 6 decimal places (USDC precision)
  const decimalPlaces = (numAmount.toString().split(".")[1] || "").length;
  if (decimalPlaces > 6) {
    return { valid: false, error: "Amount cannot have more than 6 decimal places" };
  }

  return { valid: true, value: numAmount };
}

/**
 * Validate deal description
 * @param description Deal description string
 * @returns Validation result
 */
export function validateDealDescription(description: string): {
  valid: boolean;
  error?: string;
} {
  if (!description || typeof description !== "string") {
    return { valid: false, error: "Description must be a non-empty string" };
  }

  const trimmed = description.trim();
  if (trimmed.length < 10) {
    return { valid: false, error: "Description must be at least 10 characters" };
  }

  if (trimmed.length > 1000) {
    return { valid: false, error: "Description cannot exceed 1000 characters" };
  }

  return { valid: true };
}

/**
 * Validate UUID format
 * @param id UUID string
 * @returns true if valid UUID v4
 */
export function isValidUUID(id: string): boolean {
  const uuidV4Regex = 
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidV4Regex.test(id);
}

/**
 * Validate transaction signature (Solana)
 * @param signature Transaction signature string
 * @returns Validation result
 */
export function validateTxSignature(signature: string): {
  valid: boolean;
  error?: string;
} {
  if (!signature || typeof signature !== "string") {
    return { valid: false, error: "Signature must be a non-empty string" };
  }

  // Solana signatures are 88-character base58 strings
  if (signature.length !== 88) {
    return { valid: false, error: "Invalid signature length" };
  }

  if (!BASE58_REGEX.test(signature)) {
    return { valid: false, error: "Signature contains invalid characters" };
  }

  return { valid: true };
}

/**
 * Sanitize user input (remove dangerous characters)
 * @param input User input string
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== "string") return "";
  
  // Remove potential XSS vectors
  return input
    .replace(/[<>]/g, "") // Remove angle brackets
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, "") // Remove event handlers
    .trim();
}

/**
 * Validate email format
 * @param email Email address string
 * @returns Validation result
 */
export function validateEmail(email: string): {
  valid: boolean;
  error?: string;
} {
  if (!email || typeof email !== "string") {
    return { valid: false, error: "Email must be a non-empty string" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: "Invalid email format" };
  }

  if (email.length > 254) {
    return { valid: false, error: "Email address too long" };
  }

  return { valid: true };
}

/**
 * Validate dispute reason
 * @param reason Dispute reason string
 * @returns Validation result
 */
export function validateDisputeReason(reason: string): {
  valid: boolean;
  error?: string;
} {
  if (!reason || typeof reason !== "string") {
    return { valid: false, error: "Dispute reason must be a non-empty string" };
  }

  const trimmed = reason.trim();
  if (trimmed.length < 20) {
    return {
      valid: false,
      error: "Dispute reason must be at least 20 characters",
    };
  }

  if (trimmed.length > 500) {
    return {
      valid: false,
      error: "Dispute reason cannot exceed 500 characters",
    };
  }

  return { valid: true };
}

/**
 * Batch validate deal creation input
 * @param input Deal creation parameters
 * @returns Validation result with specific field errors
 */
export interface DealCreationInput {
  buyerWallet: string;
  sellerWallet: string;
  amount: string | number;
  description: string;
}

export function validateDealCreation(input: DealCreationInput): {
  valid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  const buyerValidation = validateWalletAddress(input.buyerWallet);
  if (!buyerValidation.valid) {
    errors.buyerWallet = buyerValidation.error!;
  }

  const sellerValidation = validateWalletAddress(input.sellerWallet);
  if (!sellerValidation.valid) {
    errors.sellerWallet = sellerValidation.error!;
  }

  if (input.buyerWallet === input.sellerWallet) {
    errors.wallets = "Buyer and seller cannot be the same wallet";
  }

  const amountValidation = validateUSDCAmount(input.amount);
  if (!amountValidation.valid) {
    errors.amount = amountValidation.error!;
  }

  const descValidation = validateDealDescription(input.description);
  if (!descValidation.valid) {
    errors.description = descValidation.error!;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
