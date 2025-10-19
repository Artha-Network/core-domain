# @trust-escrow/core-domain

**Pure TypeScript domain models & helpers** for Artha Network’s decentralized escrow.  
 

---

## Scope & Guarantees

- **Pure functions only**: input → output; no I/O.
- **Stable, explicit domain models** for Deal, Evidence, Dispute/Tickets, Attestations, and Reputation.
- **State machine** validates and enforces allowed status transitions.
- **Evidence policy** assures immutable references (CIDs) and basic constraints; privacy is respected.
- **Deterministic results**: serializable inputs produce identical outputs—ideal for tests and codegen.

> Anything that touches storage, cryptography/wallets, network calls, or UI lives **outside** this module.

---

## Why this module exists

- Centralize business rules in one place so API, jobs, and clients all apply **the same logic**.
- Keep on‑chain/off‑chain concerns **separable** but **consistent**.
- Enable **pre‑flight validation** before side effects (uploads, payments, contract calls).

---

## Domain Glossary

- **Deal**: Agreement between seller/buyer with price, deadlines, and a dispute window.
- **Status**: `INIT → FUNDED → (DELIVERED?) → RELEASED | REFUNDED | DISPUTED → RESOLVED`.
- **Evidence**: Off‑chain artifacts referenced by immutable CIDs (e.g., Arweave/IPFS).
- **Dispute**: Lock state until a signed **ResolveTicket** is applied.
- **ResolveTicket**: Decision + rationale CID + signer key + confidence + timestamp.
- **Attestation/Reputation**: Lifecycle‑driven events and a 0–100 score heuristic.

---

## Modules (what’s inside)

- **`types.ts`** — Branded IDs & core types: `DealId`, `UserId`, `UsdCents`, `Deal`, `DealStatus`, `Evidence`, `ResolveTicket`, `Attestation`.
- **`deal.ts`** — State machine & guards: `validateDeal`, `allowedTransitions`, `applyStatus` (pure reducer).
- **`evidence.ts`** — Evidence policy: `isEvidenceAcceptable`, `mergeEvidence`, `requireImmutableAnchors`.
- **`arbitration.ts`** — Ticket schema & checks: `validateResolveTicket`, `applyTicketToDeal`.
- **`reputation.ts`** — V1 heuristic & attestation helpers: `scoreReputation`, `attestFromLifecycle`.
- **`errors.ts`** — `DomainError` + stable codes (`E_DEAL_INVALID`, `E_TRANSITION_BLOCKED`, `E_EVIDENCE_POLICY`, `E_TICKET_INVALID`, ...).

All exports are **pure** (no side effects). Functions return typed values or typed `DomainError`s (no throws in normal control flow).

---

## Deal Model

### Key fields
- `dealId: DealId`, `seller: UserId`, `buyer?: UserId`
- `priceUsd: UsdCents`, `fundedPriceUsd?: UsdCents`
- `deliveryDeadline: IsoDate`, `disputeWindowSecs: number`
- `status: DealStatus` (`INIT | FUNDED | DELIVERED | DISPUTED | RELEASED | REFUNDED | RESOLVED`)
- `evidenceCids: string[]` (immutable, deduped)

### Allowed transitions
- `INIT → FUNDED` — buyer deposit locked.
- `FUNDED → DELIVERED` — seller marks delivered.
- `DELIVERED → RELEASED` — buyer confirms release.
- `FUNDED | DELIVERED → DISPUTED` — within dispute window.
- `DISPUTED → RESOLVED` — apply **ResolveTicket** (AI arbiter or human).  
- Terminal execution intent (derived): `RESOLVED → RELEASED | REFUNDED | SPLIT`.

Any other transition is rejected with `E_TRANSITION_BLOCKED` (contains `from`, `to`, and reason).

---

## Evidence Policy (pure validation)

- **Immutable anchoring**: Evidence must be referenced by immutable CIDs (Arweave/IPFS).
- **Deduplication**: Incoming CIDs are deduped and order‑preserved.
- **Basic constraints**: Count/size limits expressed as integers for outer layers to enforce.
- **Privacy**: No raw PII inside domain rationale; only CIDs and structured metadata.

Helpers:
- `isEvidenceAcceptable(e: Evidence): Result<Evidence, DomainError>`
- `mergeEvidence(existing: string[], incoming: string[]): string[]`
- `requireImmutableAnchors(cids: string[]): Result<string[], DomainError>`

---

## Dispute & Arbitration

**ResolveTicket** (pure struct):
- `decision: 'release' | 'refund' | 'split'`
- `percentToSeller?: number` (required for `split`, 0–100)
- `rationaleCid: string` (immutable)
- `confidence: number` (0.0–1.0)
- `arbiterKey: string` (ed25519 public key bytes/base58/hex string — format policy is defined here)
- `issuedAt: IsoDate`

Validation:
- Schema and coherence checks (e.g., `split` requires 0–100%).
- `applyTicketToDeal(deal, ticket)` returns:
  - the **new deal** in `RESOLVED`,
  - an **execution intent**: `'release' | 'refund' | 'split'` (with `splitPct` if applicable).
  - This module does **not** move funds; execution is an outer responsibility.

---

## Reputation & Attestations

- `attestFromLifecycle(before: Deal, after: Deal): Attestation[]` — emits event(s) based on state changes (e.g., success, refund, disputed‑then‑resolved).
- `scoreReputation(history: Attestation[]): number` — returns **0–100**, with caps and simple decay. Pure and deterministic.

---

## Error Model

- `DomainError` with stable codes:
  - `E_DEAL_INVALID`
  - `E_TRANSITION_BLOCKED`
  - `E_EVIDENCE_POLICY`
  - `E_TICKET_INVALID`
  - `E_TIME_WINDOW`
  - `E_UNSUPPORTED_ACTION`
- All functions return `Result<T, DomainError>` style tagged unions.

---

## API Sketch (signatures only)

```ts
// Result type
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

// Deal
function validateDeal(d: Deal): Result<Deal, DomainError>;
function allowedTransitions(s: DealStatus): DealStatus[];
function applyStatus(d: Deal, next: DealStatus, nowIso: string): Result<Deal, DomainError>;

// Evidence
function isEvidenceAcceptable(e: Evidence): Result<Evidence, DomainError>;
function mergeEvidence(existing: string[], incoming: string[]): string[];
function requireImmutableAnchors(cids: string[]): Result<string[], DomainError>;

// Arbitration
function validateResolveTicket(t: ResolveTicket): Result<ResolveTicket, DomainError>;
function applyTicketToDeal(d: Deal, t: ResolveTicket): Result<{
  deal: Deal;
  execution: 'release' | 'refund' | 'split';
  splitPct?: number;
}, DomainError>;

// Reputation
function attestFromLifecycle(before: Deal, after: Deal): Attestation[];
function scoreReputation(history: Attestation[]): number;
```

---

## Versioning & Testing

- **SemVer**: Breaking changes to models or transitions bump **major**.
- Tests should cover: valid/invalid transitions, evidence policy edges, ticket checks, reputation caps/decay.

---

## Install

```bash
pnpm add @trust-escrow/core-domain
# or
npm i @trust-escrow/core-domain
```

---

## Using it (typical flow)

1. Construct a `Deal` → `validateDeal` (pure).  
2. Move through lifecycle via `applyStatus` (pure).  
3. On dispute, validate evidence (`isEvidenceAcceptable`) and attach CIDs (from storage layer).  
4. Apply an arbiter ticket (`validateResolveTicket` → `applyTicketToDeal`) to produce a resolved deal & execution intent.  
5. Emit attestations and compute updated reputation.

---

## Out of Scope

- Uploading files or pinning CIDs (see `@trust-escrow/storage-lib`).  
- Wallet/contract calls, signing/verification, notifications, or DB storage.  
- Any network or filesystem I/O.

---

## Maintainers

- **Sampada Dhungana** — Maintainer  
- Bijay Prasai — Maintainer  
-BIrochan - Maintainer
 - Tancho Pa- Maintainer
- Artha Network team
