// ---------- Sprint 3: participants + payouts ----------

export type PartyId = string;

export enum DealRole {
  BUYER = "buyer",
  SELLER = "seller",
  ARBITER = "arbiter",
}

export interface DealParticipants {
  buyerId: PartyId;
  sellerId: PartyId;
  arbiterId?: PartyId;
}

export interface DealFunding {
  /** Amount in smallest unit (lamports / wei / cents etc.). */
  amountTotal: bigint;
  /** Protocol fee in basis points (0–10_000). */
  protocolFeeBps: number;
}

export type DealResolutionKind =
  | "release_to_seller"
  | "refund_to_buyer"
  | "split";

export interface DealResolutionInput {
  kind: DealResolutionKind;
  /**
   * Only relevant when kind === "split".
   * Buyer share in basis points (0–10_000). Seller gets the rest.
   */
  buyerShareBps?: number;
}

export interface PayoutBreakdown {
  buyerRefund: bigint;
  sellerPayout: bigint;
  protocolFee: bigint;
}

/**
 * Deterministic payout calculator – no chain / DB / I/O.
 */
export function computePayouts(
  funding: DealFunding,
  resolution: DealResolutionInput,
): PayoutBreakdown {
  const { amountTotal, protocolFeeBps } = funding;

  if (amountTotal < 0n) {
    throw new Error("amountTotal must be non-negative");
  }
  if (protocolFeeBps < 0 || protocolFeeBps > 10_000) {
    throw new Error("protocolFeeBps must be between 0 and 10_000");
  }

  const fee = (amountTotal * BigInt(protocolFeeBps)) / 10_000n;
  const net = amountTotal - fee;

  switch (resolution.kind) {
    case "release_to_seller":
      return {
        buyerRefund: 0n,
        sellerPayout: net,
        protocolFee: fee,
      };

    case "refund_to_buyer":
      return {
        buyerRefund: net,
        sellerPayout: 0n,
        protocolFee: fee,
      };

    case "split": {
      const buyerShareBps =
        resolution.buyerShareBps ?? 5_000; // default 50/50
      if (buyerShareBps < 0 || buyerShareBps > 10_000) {
        throw new Error("buyerShareBps must be between 0 and 10_000");
      }

      const buyerRefund = (net * BigInt(buyerShareBps)) / 10_000n;
      const sellerPayout = net - buyerRefund;

      return {
        buyerRefund,
        sellerPayout,
        protocolFee: fee,
      };
    }

    default: {
      const _never: never = resolution.kind;
      throw new Error(`Unhandled resolution kind: ${_never}`);
    }
  }
}
