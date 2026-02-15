export const MAX_EVIDENCE_SIZE_MB = 25;
export const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "application/pdf",
  "video/mp4",
  "text/plain"
]);

export interface EvidenceMetadata {
  id: string;
  uploaderId: string;
  mimeType: string;
  sizeBytes: number;
  timestamp: number;
  hash: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates a batch of evidence metadata against domain rules.
 */
export function validateEvidenceBatch(evidenceList: EvidenceMetadata[]): ValidationResult {
  const errors: string[] = [];

  // Invariant 1: Must have at least one piece of evidence
  if (evidenceList.length === 0) {
    return { valid: false, errors: ["Evidence batch cannot be empty"] };
  }

  evidenceList.forEach((item, index) => {
    // Check Mime Type
    if (!ALLOWED_MIME_TYPES.has(item.mimeType)) {
      errors.push(`Item ${index} (${item.id}): Unsupported MIME type '${item.mimeType}'`);
    }

    // Check Size
    if (item.sizeBytes > MAX_EVIDENCE_SIZE_MB * 1024 * 1024) {
      errors.push(`Item ${index} (${item.id}): Exceeds max size of ${MAX_EVIDENCE_SIZE_MB}MB`);
    }

    // Check Time Travel (Timestamp cannot be in the future)
    // Note: We allow 5 minutes clock skew
    if (item.timestamp > Date.now() + 5 * 60 * 1000) {
      errors.push(`Item ${index} (${item.id}): Timestamp is in the future`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Helper to generate a tamper-proof manifest string
 */
export function generateEvidenceManifest(dealId: string, evidence: EvidenceMetadata[]): string {
  // Sort by hash to ensure deterministic output regardless of upload order
  const sorted = [...evidence].sort((a, b) => a.hash.localeCompare(b.hash));
  
  const manifestObj = {
    dealId,
    totalItems: sorted.length,
    items: sorted.map(e => ({ h: e.hash, s: e.sizeBytes }))
  };

  return JSON.stringify(manifestObj);
}
