 // src/errors.ts
// Core-domain error model for @trust-escrow/core-domain
// -----------------------------------------------------------------------------
// PURPOSE
//   A tiny, stable set of error codes + helpers for all pure domain modules
//   (deal.ts, evidence.ts, arbitration.ts, reputation.ts).
//
// PRINCIPLES
//   • Pure data only (no Error instances thrown by default).
//   • Deterministic & serializable (safe for logs, tests, IPC).
//   • Stable codes that UIs/clients can branch on.
//
// USAGE (pattern)
//   import { Result, ok, err, DomainError, E } from './errors';
//   function doThing(): Result<Out, DomainError> {
//     if (bad) return err(E.E_DEAL_INVALID, 'reason', { field: 'priceUsd' });
//     return ok(value);
//   }
//
// NOTE
//   Domain modules SHOULD return Result<T,DomainError> instead of throwing;
//   infra layers may translate DomainError into HTTP/status or thrown exceptions.
//

// -----------------------------------------------------------------------------
// Error codes (stable)
// -----------------------------------------------------------------------------
export const E = {
  E_DEAL_INVALID:        'E_DEAL_INVALID',
  E_TRANSITION_BLOCKED:  'E_TRANSITION_BLOCKED',
  E_EVIDENCE_POLICY:     'E_EVIDENCE_POLICY',
  E_TICKET_INVALID:      'E_TICKET_INVALID',
  E_TIME_WINDOW:         'E_TIME_WINDOW',
  E_UNSUPPORTED_ACTION:  'E_UNSUPPORTED_ACTION',
} as const;

export type DomainErrorCode = typeof E[keyof typeof E];

// -----------------------------------------------------------------------------
// DomainError shape
// -----------------------------------------------------------------------------
export interface DomainError {
  /** Stable machine code (see E.*) */
  code: DomainErrorCode;
  /** Short human-readable summary (single sentence if possible) */
  message: string;
  /**
   * Structured context for debugging/UX, e.g. { from:'FUNDED', to:'REFUNDED' }
   * Keep values JSON-serializable and non-sensitive.
   */
  details?: Record<string, unknown>;
}

// Type guard
export function isDomainError(x: unknown): x is DomainError {
  return !!x && typeof x === 'object'
    && 'code' in (x as any)
    && 'message' in (x as any);
}

// -----------------------------------------------------------------------------
// Result helper (tagged union) for pure flows
// -----------------------------------------------------------------------------
export type Result<T, EErr = DomainError> =
  | { ok: true;  value: T }
  | { ok: false; error: EErr };

export function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

/**
 * Build a DomainError result (most common path).
 * @example
 *   return err(E.E_DEAL_INVALID, 'priceUsd must be > 0', { priceUsd });
 */
export function err(code: DomainErrorCode, message: string, details?: Record<string, unknown>): Result<never> {
  return { ok: false, error: { code, message, details } };
}

// -----------------------------------------------------------------------------
// Convenience constructors (optional sugar)
// -----------------------------------------------------------------------------
export const Errors = {
  dealInvalid: (message: string, details?: Record<string, unknown>) =>
    ({ code: E.E_DEAL_INVALID, message, details } satisfies DomainError),

  transitionBlocked: (from: string, to: string, reason?: string) =>
    ({ code: E.E_TRANSITION_BLOCKED, message: `Transition ${from} → ${to} not allowed`, details: { from, to, reason } } satisfies DomainError),

  evidencePolicy: (message: string, details?: Record<string, unknown>) =>
    ({ code: E.E_EVIDENCE_POLICY, message, details } satisfies DomainError),

  ticketInvalid: (message: string, details?: Record<string, unknown>) =>
    ({ code: E.E_TICKET_INVALID, message, details } satisfies DomainError),

  timeWindow: (message: string, details?: Record<string, unknown>) =>
    ({ code: E.E_TIME_WINDOW, message, details } satisfies DomainError),

  unsupported: (message: string, details?: Record<string, unknown>) =>
    ({ code: E.E_UNSUPPORTED_ACTION, message, details } satisfies DomainError),
} as const;
