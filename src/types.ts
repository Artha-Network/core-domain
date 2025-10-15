// ---------- Core type utilities ----------
type Brand<T, B extends string> = T & { readonly __brand: B };

// ---------- Strong IDs & parties ----------
export type DealId = Brand<string, "DealId">;
export type UserId = Brand<string, "UserId">;

export enum Party {
  BUYER = "BUYER",
  SELLER = "SELLER",
}

// ---------- Currency & amounts ----------
export type CurrencySymbol = "USDC" | "SOL" | "USD_TEST";

export type Amount = {
  /** smallest unit (e.g., lamports for SOL, 6-dp for USDC) */
  value: bigint;
  currency: CurrencySymbol;
};

// ---------- Deal states ----------
export enum DealStatus {
  INITIATED = "INITIATED",
  FUNDED    = "FUNDED",
  RELEASED  = "RELEASED",
  DISPUTED  = "DISPUTED",
  REFUNDED  = "REFUNDED",
}

// ---------- Deal model (pure data) ----------
export type Deal = {
  id: DealId;
  buyer: UserId;
  seller: UserId;
  amount: Amount;
  /** unix epoch ms */
  createdAt: number;
  status: DealStatus;
};

// ---------- Small guards ----------
export function isPositiveAmount(a: Amount): boolean {
  return a.value > 0n;
}

export function isDifferentParties(buyer: UserId, seller: UserId): boolean {
  return buyer !== seller;
}
