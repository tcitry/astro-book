import assert from 'node:assert/strict';
import test from 'node:test';
import { needsPublication } from '../../../scripts/release-status.mjs';

const pkg = { name: '@tcitry/astro-book', version: '0.1.0' };
const registry = (status, body) => async () => new Response(JSON.stringify(body), { status });

test('first package and new versions require publication', async () => {
  assert.equal(await needsPublication(pkg, '', registry(404, {})), true);
  assert.equal(await needsPublication(pkg, '', registry(200, { name: pkg.name, versions: {} })), true);
});

test('rerunning a published version skips publication', async () => {
  assert.equal(await needsPublication(pkg, '', registry(200, { name: pkg.name, versions: { '0.1.0': {} } })), false);
});

test('registry errors and malformed responses fail closed', async () => {
  for (const status of [401, 403, 429, 500]) {
    await assert.rejects(needsPublication(pkg, '', registry(status, {})), /registry returned/);
  }
  await assert.rejects(needsPublication(pkg, '', registry(200, { name: pkg.name })), /versions missing/);
  await assert.rejects(needsPublication(pkg, '', async () => { throw new Error('network failed'); }), /network failed/);
});

test('rejects version mismatch, prereleases and unexpected names before contacting npm', async () => {
  const unexpected = async () => { assert.fail('Must not contact registry'); };
  await assert.rejects(needsPublication(pkg, '0.2.0', unexpected), /Requested version/);
  await assert.rejects(needsPublication({ ...pkg, version: '0.2.0-beta.1' }, '', unexpected), /stable versions/);
  await assert.rejects(needsPublication({ ...pkg, name: 'astro-book' }, '', unexpected));
});
