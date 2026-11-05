import assert from 'node:assert/strict';
import test from 'node:test';
import { readdir, readFile } from 'node:fs/promises';

const sources = async (dir) => {
  const entries = await readdir(new URL(dir, import.meta.url), { recursive: true });
  return entries.filter((name) => /\.(?:ts|js|astro)$/.test(name)).map((name) => new URL(`${dir}${name}`, import.meta.url));
};

test('browser code avoids Array.prototype.at for Chrome < 92', async () => {
  for (const file of [...await sources('../src/client/'), ...await sources('../src/components/')]) {
    assert.doesNotMatch(await readFile(file, 'utf8'), /\.at\(/, `${file.pathname} calls .at()`);
  }
});
