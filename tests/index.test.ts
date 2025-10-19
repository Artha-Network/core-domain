// tests/index.test.ts
// Minimal, documented smoke tests for @trust-escrow/storage-lib.
//
// These tests are SAFE TO RUN LOCALLY when you have working endpoints/tokens.
// In CI, they AUTO-SKIP if required env vars are missing to avoid flaky network.
// Run with:  pnpm test
//
// What we cover:
// 1) dualPin() computes a SHA-256 and returns primary+mirror refs.
// 2) verify() passes for both refs when content is retrievable.
//
// NOTE: These are integration-style tests (hit real gateways).
// For unit tests, mock fetch and assert call semantics separately.

import { test, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { StorageLib } from '../src/index.js';

const requiredEnvs = [
  'IPFS_ENDPOINT',
  'IPFS_TOKEN',
  'ARWEAVE_ENDPOINT',
];

function hasAllEnvs() {
  return requiredEnvs.every((k) => typeof process.env[k] === 'string' && process.env[k]!.length > 0);
}

let lib: StorageLib;

before(async function () {
  if (!hasAllEnvs()) {
    this.skip(`Missing env for live integration test. Required: ${requiredEnvs.join(', ')}`);
  }
  // Disable Postgres in tests by default (no DB needed for smoke test).
  lib = new StorageLib(false);
  // If you want to test Postgres path, set DATABASE_URL and flip to true:
  // lib = new StorageLib(true);
  // await lib.init();
});

beforeEach(() => {
  if (!hasAllEnvs()) test.skip();
});

test('dualPin() returns primary (Arweave) + mirror (IPFS) and a 64-char sha256', async () => {
  const payload = Buffer.from('hello artha');
  const res = await lib.dualPin(payload, { contentType: 'text/plain' });

  assert.ok(res.primary && res.primary.cid && res.primary.backend === 'arweave');
  assert.ok(res.mirror && res.mirror.cid && res.mirror.backend === 'ipfs');
  assert.equal(res.integrity.computedSha256.length, 64, 'sha256 hex must be 64 chars');
});

test('verify() succeeds for both refs', async () => {
  const payload = Buffer.from('verifiable content 🍀');
  const res = await lib.dualPin(payload, { contentType: 'text/plain' });

  const expected = res.integrity.computedSha256;
  // Access the underlying stores via documented getters
  const okPrimary = await lib.arweave.verify(res.primary.cid, expected);
  const okMirror = await lib.ipfs.verify(res.mirror.cid, expected);

  assert.equal(okPrimary, true, 'primary (Arweave) should verify');
  assert.equal(okMirror, true, 'mirror (IPFS) should verify');
});
