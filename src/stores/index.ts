// src/stores/index.ts
// Barrel exports for storage adapters in @trust-escrow/storage-lib.
// Keeps import paths short and stable for consumers.
//
// Usage (internal or external):
//   import { IpfsStore, ArweaveStore, IStore } from '@trust-escrow/storage-lib/dist/stores';
//
// Note: The package entry (src/index.ts) already re-exports adapters,
// but this barrel is handy for direct adapter access if needed.

export type { IStore } from './IStore.js';
export { IpfsStore } from './ipfsStore.js';
export { ArweaveStore } from './arweaveStore.js';
