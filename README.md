# core-domain
Pure TS domain types &amp; business helpers (no IO).

---
```md
# @trust-escrow/core-domain

Pure TypeScript domain models & helpers. No I/O. Shared across services.

## Modules
- `deal.ts`        — states, transitions, invariants
- `dispute.ts`     — dispute lifecycle helpers
- `evidence.ts`    — CID lists, size/type guards
- `reputation.ts`  — simple scoring (v1)

## Install
```bash
pnpm add @trust-escrow/core-domain
Usage
import { isTransitionAllowed, DealStatus } from "@trust-escrow/core-domain/deal";

if (!isTransitionAllowed(DealStatus.FUNDED, DealStatus.DISPUTED)) throw Error("bad");
Tests
Deterministic state transition table
Property tests: no illegal transitions
License

MIT
