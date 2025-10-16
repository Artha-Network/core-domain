# @trust-escrow/core-domain

Pure **TypeScript** domain models & helpers. **No I/O** (no DB, network, files).  
Intended to be the **single source of truth** for deal lifecycle, evidence rules, and simple reputation.

---

## Modules (what’s inside)

- `types.ts` — core types: branded IDs, `Amount`, `Deal`, `DealStatus`, tiny guards.
- `deal.ts` — **state machine**: allowed transitions, `validateDeal`, `applyStatus`.
- `evidence.ts` — evidence model + **policy guard** (`isEvidenceAcceptable`).
- `reputation.ts` — **v1 heuristic** reputation score (0–100).
- `errors.ts` — `DomainError` + stable error codes.

> All functions are **pure** and deterministic. Consumers (API, UI, jobs, on-chain codegen) import from here.

---

## Install

```bash
pnpm add @trust-escrow/core-domain
# or: npm i @trust-escrow/core-domain
