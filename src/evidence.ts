/**
 * @module evidence
 * @description Evidence validation and CID management helpers
 */

import { EvidenceType } from "./dispute";

/**
 * Maximum file sizes per evidence type (in bytes)
 */
export const MAX_FILE_SIZES: Record<EvidenceType, number> = {
  [EvidenceType.TEXT]: 1 * 1024 * 1024,        // 1MB
  [EvidenceType.IMAGE]: 10 * 1024 * 1024,      // 10MB
  [EvidenceType.DOCUMENT]: 25 * 1024 * 1024,   // 25MB
  [EvidenceType.VIDEO]: 100 * 1024 * 1024,     // 100MB
  [EvidenceType.CHAT_LOG]: 5 * 1024 * 1024,    // 5MB
  [EvidenceType.TRANSACTION]: 512 * 1024,      // 512KB
  [EvidenceType.OTHER]: 10 * 1024 * 1024,      // 10MB
};

/**
 * Allowed MIME types per evidence type
 */
export const ALLOWED_MIME_TYPES: Record<EvidenceType, string[]> = {
  [EvidenceType.TEXT]: ["text/plain", "text/markdown"],
  [EvidenceType.IMAGE]: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  [EvidenceType.DOCUMENT]: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  [EvidenceType.VIDEO]: ["video/mp4", "video/webm", "video/quicktime"],
  [EvidenceType.CHAT_LOG]: ["text/plain", "application/json", "text/csv"],
  [EvidenceType.TRANSACTION]: ["application/json", "text/plain"],
  [EvidenceType.OTHER]: ["*/*"],
};

/**
 * CID validation result
 */
export interface CIDValidation {
  valid: boolean;
  version?: "v0" | "v1";
  error?: string;
}

/**
 * Validate IPFS CID format with version detection
 * @param cid IPFS CID string
 * @returns Validation result with CID version
 */
export function validateCID(cid: string): CIDValidation {
  if (!cid || typeof cid !== "string") {
    return { valid: false, error: "CID must be a non-empty string" };
  }

  // CIDv0: Qm followed by 44 base58 characters
  const cidV0Pattern = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
  if (cidV0Pattern.test(cid)) {
    return { valid: true, version: "v0" };
  }

  // CIDv1: base32 multibase prefix 'b' followed by 58 characters
  const cidV1Pattern = /^b[a-z2-7]{58}$/;
  if (cidV1Pattern.test(cid)) {
    return { valid: true, version: "v1" };
  }

  return {
    valid: false,
    error: "Invalid CID format. Must be CIDv0 (Qm...) or CIDv1 (b...)",
  };
}

/**
 * Validate evidence file size against type limits
 * @param sizeBytes File size in bytes
 * @param type Evidence type
 * @returns Validation result
 */
export function validateEvidenceFileSize(
  sizeBytes: number,
  type: EvidenceType
): { valid: boolean; error?: string } {
  if (sizeBytes <= 0) {
    return { valid: false, error: "File size must be greater than 0" };
  }

  const maxSize = MAX_FILE_SIZES[type];
  if (sizeBytes > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File size exceeds maximum of ${maxSizeMB}MB for ${type}`,
    };
  }

  return { valid: true };
}

/**
 * Validate MIME type against allowed types for evidence category
 * @param mimeType File MIME type
 * @param type Evidence type
 * @returns true if MIME type is allowed
 */
export function isAllowedMimeType(mimeType: string, type: EvidenceType): boolean {
  const allowed = ALLOWED_MIME_TYPES[type];
  return allowed.includes("*/*") || allowed.includes(mimeType);
}

/**
 * Generate IPFS gateway URL from CID
 * @param cid IPFS CID
 * @param gateway Gateway base URL (default: ipfs.io)
 * @returns Full gateway URL
 */
export function getIPFSGatewayURL(
  cid: string,
  gateway: string = "https://ipfs.io"
): string {
  const validation = validateCID(cid);
  if (!validation.valid) {
    throw new Error(validation.error || "Invalid CID");
  }
  
  return `${gateway}/ipfs/${cid}`;
}

/**
 * Generate Arweave gateway URL from transaction ID
 * @param txId Arweave transaction ID
 * @param gateway Gateway base URL (default: arweave.net)
 * @returns Full gateway URL
 */
export function getArweaveGatewayURL(
  txId: string,
  gateway: string = "https://arweave.net"
): string {
  // Arweave TX IDs are 43-character base64url strings
  const arweaveTxPattern = /^[A-Za-z0-9_-]{43}$/;
  if (!arweaveTxPattern.test(txId)) {
    throw new Error("Invalid Arweave transaction ID format");
  }

  return `${gateway}/${txId}`;
}

/**
 * Extract CID from IPFS URL
 * @param url IPFS URL (ipfs://, ipfs.io, etc.)
 * @returns Extracted CID or null
 */
export function extractCIDFromURL(url: string): string | null {
  // ipfs:// protocol
  const ipfsProtocol = url.match(/^ipfs:\/\/(.+)$/);
  if (ipfsProtocol) return ipfsProtocol[1];

  // Gateway URLs like https://ipfs.io/ipfs/Qm...
  const gatewayMatch = url.match(/\/ipfs\/([^/]+)/);
  if (gatewayMatch) return gatewayMatch[1];

  // Subdomain gateway like https://Qm....ipfs.dweb.link
  const subdomainMatch = url.match(/^https?:\/\/([^.]+)\.ipfs\./);
  if (subdomainMatch) return subdomainMatch[1];

  return null;
}

/**
 * Validate evidence list integrity
 * @param cids Array of CIDs
 * @returns Validation result with invalid CIDs
 */
export function validateEvidenceList(
  cids: string[]
): { valid: boolean; invalidCIDs: string[]; error?: string } {
  if (!Array.isArray(cids)) {
    return { valid: false, invalidCIDs: [], error: "Evidence list must be an array" };
  }

  if (cids.length === 0) {
    return { valid: false, invalidCIDs: [], error: "Evidence list cannot be empty" };
  }

  if (cids.length > 10) {
    return { valid: false, invalidCIDs: [], error: "Maximum 10 evidence items allowed" };
  }

  const invalidCIDs = cids.filter((cid) => !validateCID(cid).valid);

  if (invalidCIDs.length > 0) {
    return {
      valid: false,
      invalidCIDs,
      error: `${invalidCIDs.length} invalid CID(s) found`,
    };
  }

  return { valid: true, invalidCIDs: [] };
}

/**
 * Format file size for display
 * @param bytes File size in bytes
 * @returns Formatted string (e.g., "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Check if CID is pinned (exists on specified gateway)
 * @param cid IPFS CID to check
 * @returns Promise resolving to pin status
 * @note This is a helper for async operations - actual implementation would use fetch
 */
export function buildPinCheckURL(cid: string): string {
  const validation = validateCID(cid);
  if (!validation.valid) {
    throw new Error(validation.error || "Invalid CID");
  }

  return `https://ipfs.io/api/v0/pin/ls?arg=${cid}`;
}
