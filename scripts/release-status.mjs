import assert from 'node:assert/strict';
import { appendFileSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export async function needsPublication(pkg, requestedVersion = '', request = fetch) {
  assert.equal(pkg.name, '@tcitry/astro-book');
  assert.match(pkg.version, /^\d+\.\d+\.\d+$/, 'Main publishes stable versions only');
  if (requestedVersion) assert.equal(pkg.version, requestedVersion, 'Requested version must match package.json');
  // Avoid a cached 404 while a freshly published version propagates through npm's CDN.
  const response = await request(`https://registry.npmjs.org/${encodeURIComponent(pkg.name)}?release-check=${Date.now()}`, {
    signal: AbortSignal.timeout(30_000),
    headers: { accept: 'application/json', 'cache-control': 'no-cache' },
  });
  if (response.status === 404) return true;
  if (!response.ok) throw new Error(`npm registry returned HTTP ${response.status}`);
  const metadata = await response.json();
  assert.equal(metadata.name, pkg.name, 'Unexpected registry package');
  assert.ok(metadata.versions && typeof metadata.versions === 'object', 'Registry versions missing');
  return !Object.hasOwn(metadata.versions, pkg.version);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const pkg = JSON.parse(readFileSync(new URL('../packages/astro-book/package.json', import.meta.url), 'utf8'));
  const publish = await needsPublication(pkg, process.env.RELEASE_VERSION);
  console.log(`${pkg.name}@${pkg.version}: ${publish ? 'ready for verification and publication' : 'already published; skipping'}`);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `publish=${publish}\n`);
}
