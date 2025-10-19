// src/postgres/index.ts
// Barrel export for the PostgreSQL metadata repository.
// Keeps import paths tidy for consumers that want direct DB access.
//
// Usage:
//   import { EvidenceRepo } from '@trust-escrow/storage-lib/dist/postgres';
//   const repo = new EvidenceRepo(); await repo.migrate(); ...

export { EvidenceRepo } from './metadata.js';
