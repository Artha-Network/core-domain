 // src/evidence.ts
// Core-domain: Evidence model policy (pure functions, no I/O)
// --------------------------------------------------------------------------------------
// PURPOSE
//   Validate evidence metadata and enforce minimal, deterministic policy constraints
//   for escrow disputes. This module DOES NOT fetch bytes or talk to storage; it only
//   reasons about immutable anchors (CIDs/TxIDs) and simple metadata.
//
// SCOPE (pure):
//   • Validate that evidence is anchored by an immutable content address (IPFS/Arweave).
//   • Optional MIME allow-list checks (if provided).
//   • Optional size hints sanity (if provided).
//   • Merge/dedupe CID lists without reordering existing items.
//
// OUT OF SCOPE (elsewhere):
//   • Uploading files, computing hashes, or pinning (see @trust-escrow/storage-lib).
//   • Persisting metadata (DB) or attaching evidence to deals (handled at service layer).

import type { Evidence } from './types';           // Expect: { cid: string; contentType?: string; sizeBytes?: number; submittedAtIso?: string }
import type { Result, DomainError } from './errors';
import { ok, err, E } from './errors';

// --------------------------------------------------------------------------------------
// Public API
// --------------------------------------------------------------------------------------

/**
 * Validate a single evidence item against immutable-anchoring and basic policy.
 * - Ensures `cid` looks like a stable, immutable content address (IPFS or Arweave).
 * - If `contentType` is provided, checks against a permissive allow-list (images/PDF/text).
 * - If `sizeBytes` is provided, must be >0 and <= DEFAULT_MAX_SIZE_BYTES.
 *
 * Returns ok(e) on success; otherwise a typed E_EVIDENCE_POLICY error.
 */
export function isEvidenceAcceptable(
  e: Evidence,
  opts?: Partial<{
    /** Max allowed size in bytes (hint only; outer layers enforce hard caps). Default 25 MiB. */
    maxSizeBytes: number;
    /** Additional MIME patterns to allow (Regex sources, joined with default allow-list). */
    extraAllowedMime: RegExp[];
  }>
): Result<Evidence, DomainError> {
  if (!e || typeof e !== 'object') {
    return err(E.E_EVIDENCE_POLICY, 'evidence must be an object');
  }
  if (!isNonEmptyString(e.cid)) {
    return err(E.E_EVIDENCE_POLICY, 'cid is required');
  }
  if (!isImmutableCid(e.cid)) {
    return err(E.E_EVIDENCE_POLICY, 'cid must be immutable (IPFS CID or Arweave tx id)', { cid: e.cid });
  }

  // MIME policy (optional)
  if (e.contentType !== undefined) {
    if (!isNonEmptyString(e.contentType)) {
      return err(E.E_EVIDENCE_POLICY, 'contentType, when provided, must be a non-empty string');
    }
    const allowed = buildAllowedMime(opts?.extraAllowedMime);
    if (!allowed.test(e.contentType)) {
      return err(E.E_EVIDENCE_POLICY, `contentType not allowed: ${e.contentType}`);
    }
  }

  // Size policy (optional)
  if (e.sizeBytes !== undefined) {
    if (!Number.isInteger(e.sizeBytes) || e.sizeBytes <= 0) {
      return err(E.E_EVIDENCE_POLICY, 'sizeBytes, when provided, must be a positive integer');
    }
    const max = opts?.maxSizeBytes ?? DEFAULT_MAX_SIZE_BYTES;
    if (e.sizeBytes > max) {
      return err(E.E_EVIDENCE_POLICY, `sizeBytes exceeds limit (${e.sizeBytes} > ${max})`, { sizeBytes: e.sizeBytes, max });
    }
  }

  // Timestamp (optional) shape sanity
  if (e.submittedAtIso !== undefined && !isIso(e.submittedAtIso)) {
    return err(E.E_EVIDENCE_POLICY, 'submittedAtIso must be an ISO timestamp when provided');
  }

  return ok(e);
}

/**
 * Ensure a set of CIDs are all immutable anchors.
 * Returns ok(deduped) on success, where `deduped` is order-preserving and unique.
 * On failure, returns E_EVIDENCE_POLICY with details of invalid indices.
 */
export function requireImmutableAnchors(cids: string[]): Result<string[], DomainError> {
  if (!Array.isArray(cids)) {
    return err(E.E_EVIDENCE_POLICY, 'cids must be an array');
  }
  const invalid: Array<{ index: number; cid: string }> = [];
  const seen = new Set<string>();
  const out: string[] = [];

  cids.forEach((c, i) => {
    if (!isNonEmptyString(c) || !isImmutableCid(c)) {
      invalid.push({ index: i, cid: c });
      return;
    }
    if (!seen.has(c)) {
      seen.add(c);
      out.push(c);
    }
  });

  if (invalid.length) {
    return err(E.E_EVIDENCE_POLICY, 'one or more cids are invalid (not immutable)', { invalid });
  }
  return ok(out);
}

/**
 * Merge existing and incoming evidence CIDs, returning an order-preserving, de-duplicated array.
 * This function is intentionally permissive (no validation); call requireImmutableAnchors()
 * separately when you need strict policy enforcement.
 */
export function mergeEvidence(existing: string[], incoming: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  for (const c of existing || []) {
    if (isNonEmptyString(c) && !seen.has(c)) {
      seen.add(c); out.push(c);
    }
  }
  for (const c of incoming || []) {
    if (isNonEmptyString(c) && !seen.has(c)) {
      seen.add(c); out.push(c);
    }
  }
  return out;
}

// --------------------------------------------------------------------------------------
// Internal helpers (pure)
// --------------------------------------------------------------------------------------

const DEFAULT_MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25 MiB

/**
 * Accept common evidence types by default (adjust via opts.extraAllowedMime).
 * - Images: jpeg, png, webp
 * - PDF
 * - Plain text and JSON
 */
function buildAllowedMime(extra?: RegExp[]): RegExp {
  const base = [
    /^image\/(jpeg|png|webp)$/i,
    /^application\/pdf$/i,
    /^text\/plain(;|$)/i,
    /^application\/json$/i,
  ];
  const all = [...base, ...(extra ?? [])];
  // Combine into one test function
  return {
    test: (s: string) => all.some((r) => r.test(s)),
  } as unknown as RegExp;
}

/**
 * Validate that a string looks like an immutable content address:
 *   • IPFS CID (v0/v1)
 *   • Arweave transaction id (base64url, ~43+ chars)
 * This is a syntactic check only; we do NOT hit the network.
 */
function isImmutableCid(cid: string): boolean {
  return isIpfsCid(cid) || isArweaveTxId(cid);
}

// IPFS: CIDv0 starts with "Qm" and is 46 chars base58btc; CIDv1 is base32 (lowercase a-z2-7), ~46–90 chars.
function isIpfsCid(cid: string): boolean {
  if (typeof cid !== 'string') return false;
  if (cid.startsWith('Qm') && cid.length === 46 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(cid)) return true; // v0 base58btc
  if (/^[a-z2-7]{46,90}$/.test(cid)) return true; // v1 base32 (approx range)
  return false;
}

// Arweave: base64url (A–Z a–z 0–9 _ -) typically 43+ chars without padding
function isArweaveTxId(id: string): boolean {
  return typeof id === 'string' && /^[A-Za-z0-9_-]{43,64}$/.test(id);
}

function isNonEmptyString(x: unknown): x is string {
  return typeof x === 'string' && x.trim().length > 0;
}

function isIso(x: unknown): x is string {
  return typeof x === 'string' && Number.isFinite(Date.parse(x));
}
