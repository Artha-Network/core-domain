// Evidence model + simple guards (pure TS)

export enum EvidenceType {
  TEXT = "TEXT",
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
  FILE = "FILE"
}

export type EvidenceItem = {
  /** Content identifier (e.g., IPFS/Arweave) */
  cid: string;
  type: EvidenceType;
  /** Byte size for basic limits */
  sizeBytes: number;
};

export type EvidencePolicy = {
  /** Max total items allowed */
  maxItems: number;
  /** Max total bytes across all items */
  maxTotalBytes: number;
  /** Optional allowed types; if omitted, all are allowed */
  allowedTypes?: readonly EvidenceType[];
};

export function isEvidenceAcceptable(
  items: readonly EvidenceItem[],
  policy: EvidencePolicy
): boolean {
  if (items.length > policy.maxItems) return false;

  const total = items.reduce((n, x) => n + (x.sizeBytes || 0), 0);
  if (total > policy.maxTotalBytes) return false;

  const typesOk =
    !policy.allowedTypes ||
    items.every(i => policy.allowedTypes!.includes(i.type));
  if (!typesOk) return false;

  // Basic CID + size sanity
  return items.every(i => typeof i.cid === "string" && i.cid.length > 0 && i.sizeBytes >= 0);
}
