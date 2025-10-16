/**
 * Core domain types (pure TypeScript, no I/O).
 *
 * - Branded string IDs to prevent accidental mixing.
 * - Strong enums for parties and deal status.
 * - Smallest-unit Amount (e.g., lamports for SOL, 6-dp for USDC).
 * - Minimal Deal model + tiny guards.
 */

// ---------- Core type utilities ----------

/**
 * Brands a primitive type so different IDs can't be mixed by accident.
 * @example
 * type DealId = Brand<string, "DealId">;
 */
type Brand<T, B extends string> = T & { readonly __brand: B };

// ---------- Strong IDs & parties ----------

/** Unique identifier for a Deal (branded string). */
export type DealId = Brand<string, "DealId">;

/** Unique identifier for a User (branded string). */
export type UserId = Brand<string, "UserId">;

/** Which side of the deal a user represents. */
export enum Party {
  BUYER = "BUYER",
  SELLER = "SELLER",
}

// ---------- Currency & amounts ----------

/**
 * Supported currency symbols for domain math.
 * - USDC: 6 decimal places
 * - SOL: lamports (1e9) at the chain layer; here we carry smallest unit in `Amount.value`
 * - USD_TEST: placeholder for local/dev
 */
export type CurrencySymbol = "USDC" | "SOL" | "USD_TEST";

/**
 * Money amount represented in the smallest unit for its currency.
 * Keep arithmetic exact by using bigint.
 */
export type Amount = {
  /** Smallest unit (e.g., lamports for SOL, 6-dp units for USDC). */
  value: bigint;
  currency: CurrencySymbol;
};

// ---------- Deal states ----------

/**
 * Canonical lifecycle states of a deal.
 * INITIATED → FUNDED → (RELEASED | DISPUTED) → (RELEASED | REFUNDED)
 */
export enum DealStatus {
  INITIATED = "INITIATED",
  FUNDED    = "FUNDED",
  RELEASED  = "RELEASED",
  DISPUTED  = "DISPUTED",
  REFUNDED  = "REFUNDED",
}

// ---------- Deal model (pure data) ----------

/**
 * Minimal immutable Deal shape used across services.
 * All fields are plain data; no methods or side effects.
 */
export type Deal = {
  /** Branded ID for the deal. */
  id: DealId;
  /** Branded user ID of the buyer. */
  buyer: UserId;
  /** Branded user ID of the seller. */
  seller: UserId;
  /** Escrow amount in smallest units. */
  amount: Amount;
  /** Creation timestamp in UNIX epoch milliseconds. */
  createdAt: number;
  /** Current lifecycle status. */
  status: DealStatus;
};

// ---------- Small guards ----------

/**
 * True if the amount is strictly greater than zero.
 * @example
 * isPositiveAmount({ value: 1_000_000n, currency: "USDC" }) // true
 */
export function isPositiveAmount(a: Amount): boolean {
  return a.value > 0n;
}

/**
 * True if buyer and seller are different branded user IDs.
 * @example
 * isDifferentParties("u1" as any, "u2" as any) // true
 */
export function isDifferentParties(buyer: UserId, seller: UserId): boolean {
  return buyer !== seller;
}
