/**
 * Evidence model + simple policy guards (pure TS).
 *
 * Use this to validate off-chain evidence bundles (e.g., IPFS/Arweave CIDs)
 * before you accept/store them in other services. No I/O here.
 */

export enum EvidenceType {
  TEXT = "TEXT",
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
  FILE = "FILE"
}

/** Single evidence item referenced by a CID (IPFS/Arweave/etc.). */
export type EvidenceItem = {
  /** Content identifier, non-empty string (e.g., "bafy..."). */
  cid: string;
  type: EvidenceType;
  /** Raw bytes size used for budget checks. Must be >= 0. */
  sizeBytes: number;
};

/**
 * Policy that constrains a bundle of evidence items.
 * - If `allowedTypes` is omitted, any EvidenceType is allowed.
 */
export type EvidencePolicy = {
  /** Max number of items allowed in the bundle. */
  maxItems: number;
  /** Max total byte size across all items. */
  maxTotalBytes: number;
  /** Optional type allowlist. */
  allowedTypes?: readonly EvidenceType[];
};

/**
 * Returns true if the evidence bundle satisfies the provided policy.
 * Performs only structural checks (count, total size, optional types,
 * non-empty CID, non-negative size).
 *
 * @example
 * const items = [
 *   { cid: "bafy123", type: EvidenceType.TEXT,  sizeBytes: 1200 },
 *   { cid: "bafy456", type: EvidenceType.IMAGE, sizeBytes: 75_000 }
 * ] as const;
 *
 * const policy = { maxItems: 5, maxTotalBytes: 1_000_000,
 *                  allowedTypes: [EvidenceType.TEXT, EvidenceType.IMAGE] };
 *
 * isEvidenceAcceptable(items, policy); // true
 */
export function isEvidenceAcceptable(
  items: readonly EvidenceItem[],
  policy: EvidencePolicy
): boolean {
  // Count
  if (items.length > policy.maxItems) return false;

  // Total size
  const total = items.reduce((n, x) => n + (x.sizeBytes || 0), 0);
  if (total > policy.maxTotalBytes) return false;

  // Type allowlist (if provided)
  const typesOk =
    !policy.allowedTypes ||
    items.every(i => policy.allowedTypes!.includes(i.type));
  if (!typesOk) return false;

  // Structural sanity: non-empty CID, non-negative size
  return items.every(i => typeof i.cid === "string" && i.cid.length > 0 && i.sizeBytes >= 0);
}
