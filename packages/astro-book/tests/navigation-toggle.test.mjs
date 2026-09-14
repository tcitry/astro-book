import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

test('hidden sidebar toggles keep their own outline off and ring the visible label', async () => {
  const css = await readFile(new URL('../src/styles/base.css', import.meta.url), 'utf8');
  assert.match(css, /input\.toggle\s*\{[^}]*outline\s*:\s*none/, 'The 0×0 checkbox must not draw its own focus ring');
  assert.match(css, /input\.toggle:focus-visible\s*\+\s*label/, 'Keyboard focus belongs on the visible expand/collapse label');
  assert.doesNotMatch(css, /:focus-visible\s*,\s*input\.toggle:focus-visible\s*\+\s*label/, 'The combined selector painted a floating ring on the hidden input');
});

test('pointer activation of a disclosure checkbox blurs so :focus-visible cannot stick', async () => {
  const script = await readFile(new URL('../src/client/book.ts', import.meta.url), 'utf8');
  assert.match(script, /pointerup/);
  assert.match(script, /classList\.contains\('toggle'\)/);
  assert.match(script, /\.blur\(\)/);
});

test('published CSS scopes the toggle outline fix', async () => {
  const css = await readFile(new URL('../dist/styles.css', import.meta.url), 'utf8');
  assert.match(css, /input\.toggle:where\([^;{]*\{[^}]*outline\s*:\s*none/);
  assert.match(css, /input\.toggle:focus-visible \+ label:where/);
});
