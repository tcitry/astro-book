import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

test('hidden sidebar toggles keep their own outline off and ring the visible label', async () => {
  const css = await readFile(new URL('../src/styles/base.css', import.meta.url), 'utf8');
  assert.match(css, /input\.toggle\s*\{[^}]*outline\s*:\s*none/, 'The 0×0 checkbox must not draw its own focus ring');
  assert.match(css, /input\.toggle:focus-visible\s*\+\s*label/, 'Keyboard focus belongs on the visible expand/collapse label');
  assert.match(css, /#menu-control:focus-visible\s*~\s*main \.book-header label\[for="menu-control"\]/, 'Mobile menu label is not an adjacent sibling of #menu-control');
  assert.match(css, /#toc-control:focus-visible\s*~\s*main \.book-header label\[for="toc-control"\]/, 'Mobile TOC label is not an adjacent sibling of #toc-control');
  assert.doesNotMatch(css, /:focus-visible\s*,\s*input\.toggle:focus-visible\s*\+\s*label/, 'The combined selector painted a floating ring on the hidden input');
});

test('pointer activation of a disclosure checkbox blurs so :focus-visible cannot stick', async () => {
  const script = await readFile(new URL('../src/client/book.ts', import.meta.url), 'utf8');
  assert.match(script, /event\.detail === 0/);
  assert.match(script, /classList\.contains\('toggle'\)/);
  assert.match(script, /nextElementSibling/);
  assert.match(script, /htmlFor !== input\.id/);
  assert.match(script, /\.blur\(\)/);
});

test('published CSS scopes the toggle outline fix', async () => {
  const css = await readFile(new URL('../dist/styles.css', import.meta.url), 'utf8');
  assert.match(css, /input\.toggle:where\([^;{]*\{[^}]*outline\s*:\s*none/);
  assert.match(css, /input\.toggle:focus-visible \+ label:where/);
  assert.match(css, /#menu-control:focus-visible ~ main .book-header label\[for="menu-control"\]:where/);
  assert.match(css, /#toc-control:focus-visible ~ main .book-header label\[for="toc-control"\]:where/);
});
