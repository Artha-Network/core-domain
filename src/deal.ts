// src/deal.ts
// Core-domain: Deal lifecycle state machine (pure functions, no I/O)
// --------------------------------------------------------------------------------------
// This module defines the allowed status transitions and pure guards used by Artha
// Network’s escrow deal lifecycle. All functions are deterministic and side-effect free.
//
// Imports are from the core-domain package; implement these in your local `types.ts` and
// `errors.ts` (or adjust the paths) when wiring the module together.

import type {
  Deal,
  DealId,
  DealStatus, // 'INIT' | 'FUNDED' | 'DELIVERED' | 'DISPUTED' | 'RELEASED' | 'REFUNDED' | 'RESOLVED'
  UsdCents,
} from './types';
import type { DomainError } from './errors';

// If your project already declares a shared Result type, import it instead.
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

// --------------------------------------------------------------------------------------
// Public API
// --------------------------------------------------------------------------------------

/**
 * Which statuses are allowed from a given current status.
 * Use to drive UI and to validate requested transitions.
 */
export function allowedTransitions(from: DealStatus): DealStatus[] {
  switch (from) {
    case 'INIT':
      return ['FUNDED'];
    case 'FUNDED':
      return ['DELIVERED', 'DISPUTED']; // dispute allowed pre-delivery within window
    case 'DELIVERED':
      return ['RELEASED', 'DISPUTED'];
    case 'DISPUTED':
      return ['RESOLVED']; // resolution decides execution intent elsewhere
    case 'RELEASED':
    case 'REFUNDED':
    case 'RESOLVED':
      return []; // terminal for the state machine; execution mapping is outside
    default:
      return [];
  }
}

/**
 * Validate Deal structure invariants that must always hold for a valid object.
 * Returns ok(value) when valid; otherwise a DomainError describing the first failure.
 */
export function validateDeal(d: Deal): Result<Deal, DomainError> {
  // Required identifiers
  if (!isNonEmptyId(d.dealId)) return err('E_DEAL_INVALID', 'Missing or empty dealId');
  if (!isNonEmptyId(d.seller)) return err('E_DEAL_INVALID', 'Missing or empty seller');

  // Monetary constraints
  if (!isUsdCents(d.priceUsd) || d.priceUsd <= 0) {
    return err('E_DEAL_INVALID', 'priceUsd must be positive cents');
  }
  if (d.fundedPriceUsd !== undefined && (!isUsdCents(d.fundedPriceUsd) || d.fundedPriceUsd <= 0)) {
    return err('E_DEAL_INVALID', 'fundedPriceUsd must be positive cents when present');
  }

  // Time constraints
  if (!isIso(d.deliveryDeadline)) return err('E_DEAL_INVALID', 'deliveryDeadline must be ISO string');
  if (!Number.isInteger(d.disputeWindowSecs) || d.disputeWindowSecs <= 0) {
    return err('E_DEAL_INVALID', 'disputeWindowSecs must be > 0');
  }

  // Status is valid
  if (!isDealStatus(d.status)) return err('E_DEAL_INVALID', `Unknown status: ${String(d.status)}`);

  // Evidence CIDs list (immutable references only checked superficially here)
  if (d.evidenceCids && !Array.isArray(d.evidenceCids)) {
    return err('E_DEAL_INVALID', 'evidenceCids must be string[] when present');
  }
  if (Array.isArray(d.evidenceCids)) {
    for (const c of d.evidenceCids) {
      if (!isNonEmptyString(c)) return err('E_DEAL_INVALID', 'evidenceCids must contain non-empty strings');
    }
    // Dedup check (order-preserving dedupe happens in evidence policy layer; here we reject obvious dupes)
    const set = new Set(d.evidenceCids);
    if (set.size !== d.evidenceCids.length) {
      return err('E_DEAL_INVALID', 'evidenceCids contains duplicates');
    }
  }

  // Status-conditional invariants
  if (d.status !== 'INIT' && d.buyer === undefined) {
    return err('E_DEAL_INVALID', 'buyer must be set once deal leaves INIT');
  }
  if (d.status !== 'INIT' && d.fundedPriceUsd !== undefined && d.fundedPriceUsd !== d.priceUsd) {
    // If you allow fx/price snapshotting, move this rule to a policy flag.
    return err('E_DEAL_INVALID', 'fundedPriceUsd must equal priceUsd (baseline policy)');
  }

  return ok(d);
}

/**
 * Pure transition reducer. Validates (1) the structure, (2) that the transition is allowed
 * by the state machine, and (3) temporal/dispute-window constraints for DISPUTED.
 *
 * - Returns ok(newDeal) with only `status` (and optionally timestamps) changed.
 * - Does NOT mutate `deal` (always returns a shallow copy).
 * - Any failure returns a typed DomainError.
 *
 * @param nowIso ISO timestamp used for time-based guards (e.g. dispute window)
 */
export function applyStatus(
  deal: Deal,
  next: DealStatus,
  nowIso: string
): Result<Deal, DomainError> {
  // Structure validation
  const v = validateDeal(deal);
  if (!v.ok) return v;

  // Quick no-op
  if (deal.status === next) return ok({ ...deal });

  // Allowed transition?
  if (!allowedTransitions(deal.status).includes(next)) {
    return err('E_TRANSITION_BLOCKED', `Transition ${deal.status} → ${next} not allowed`);
  }

  // Temporal guard: entering DISPUTED must be within dispute window from delivery deadline
  if (next === 'DISPUTED') {
    const within = isWithinDisputeWindow(deal.deliveryDeadline, deal.disputeWindowSecs, nowIso);
    if (!within) return err('E_TIME_WINDOW', 'Dispute window has expired');
  }

  // When moving to RELEASED or REFUNDED after DELIVERED, ensure still within window or explicitly allowed by policy.
  if ((next === 'RELEASED' || next === 'REFUNDED') && deal.status === 'DELIVERED') {
    const within = isWithinDisputeWindow(deal.deliveryDeadline, deal.disputeWindowSecs, nowIso);
    if (!within && next !== 'RELEASED') {
      // baseline policy: late REFUND post-window is not allowed without dispute+resolution
      return err('E_TIME_WINDOW', `Cannot ${next.toLowerCase()} after dispute window without resolution`);
    }
  }

  // Apply transition (pure copy). You can add status timestamps if your `Deal` supports them.
  const updated: Deal = { ...deal, status: next };
  return ok(updated);
}

// --------------------------------------------------------------------------------------
// Helpers (pure, internal)
// --------------------------------------------------------------------------------------

function isWithinDisputeWindow(deliveryDeadlineIso: string, windowSecs: number, nowIso: string): boolean {
  const deadline = Date.parse(deliveryDeadlineIso);
  const now = Date.parse(nowIso);
  if (!Number.isFinite(deadline) || !Number.isFinite(now)) return false;

  // Window opens at "deliveryDeadline" and extends by disputeWindowSecs
  const windowEnd = deadline + windowSecs * 1000;
  return now <= windowEnd;
}

function isNonEmptyId(x: unknown): x is DealId {
  return typeof x === 'string' && x.trim().length > 0;
}
function isNonEmptyString(x: unknown): x is string {
  return typeof x === 'string' && x.trim().length > 0;
}
function isUsdCents(x: unknown): x is UsdCents {
  return Number.isInteger(x) && typeof x === 'number';
}
function isIso(x: unknown): x is string {
  return typeof x === 'string' && Number.isFinite(Date.parse(x));
}
function isDealStatus(x: unknown): x is DealStatus {
  return x === 'INIT' || x === 'FUNDED' || x === 'DELIVERED' ||
         x === 'DISPUTED' || x === 'RELEASED' || x === 'REFUNDED' || x === 'RESOLVED';
}

function ok<T>(value: T): Result<T, DomainError> {
  return { ok: true, value };
}
function err(code: DomainError['code'], message: string): Result<never, DomainError> {
  return { ok: false, error: { code, message } as DomainError };
}

// --------------------------------------------------------------------------------------
// Notes
// -----
// • Execution mapping (e.g., how RESOLVED leads to on-chain RELEASED/REFUNDED/SPLIT)
//   is deliberately outside this pure reducer. The arbiter ticket module should
//   compute an execution intent; an outer service performs state effects.
// • If you support delivery *before* the deadline, you can model a deliveredAt timestamp
//   in Deal and switch the dispute window anchor to deliveredAt (preferred).
// • If your policy allows late releases (post-window) but not refunds, adjust guards above.
// --------------------------------------------------------------------------------------
