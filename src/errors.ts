// Centralized domain error types (pure TS)

export class DomainError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "DomainError";
  }
}

// Error codes (string literals so they’re stable across repos)
export const ERR_ILLEGAL_TRANSITION = "ERR_ILLEGAL_TRANSITION";
export const ERR_INVALID_DEAL = "ERR_INVALID_DEAL";
export const ERR_INVALID_EVIDENCE = "ERR_INVALID_EVIDENCE";
