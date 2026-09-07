import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import postcss from 'postcss';
import { expandColorSchemes } from '../scripts/color-scheme.mjs';

const inColorMedia = (node) => {
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (parent.type === 'atrule' && parent.name === 'media' && /prefers-color-scheme/.test(parent.params)) return true;
  }
  return false;
};

test('manual light rejects system-dark gradients and manual dark receives them without a media condition', () => {
  const output = postcss.parse(expandColorSchemes('\uFEFF@media (prefers-color-scheme: dark) { :where(html[data-astro-book]) .example-gradient { background: linear-gradient(black, gray); } }'));
  const rules = [];
  output.walkRules((rule) => rules.push(rule));
  assert.equal(rules.length, 2);
  assert.match(rules[0].selector, /:where\(html\[data-astro-book\]:not\(\[data-book-theme="light"\]\)\)/);
  assert.equal(inColorMedia(rules[0]), true);
  assert.match(rules[1].selector, /:where\(html\[data-astro-book\]\[data-book-theme="dark"\]\)/);
  assert.equal(inColorMedia(rules[1]), false);
  assert.equal(rules[0].first.value, rules[1].first.value);
  assert.doesNotMatch(output.toString(), /\uFEFF/);
});

test('light-theme rules preserve surrounding and nested viewport constraints', () => {
  const output = postcss.parse(expandColorSchemes('@media (min-width: 50rem) { @media (prefers-color-scheme: light) { @media (orientation: landscape) { :where([data-astro-book]) .example-accent { color: teal; } } } }'));
  const rules = [];
  output.walkRules((rule) => rules.push(rule));
  assert.equal(rules.length, 2);
  assert.match(rules[0].selector, /:not\(\[data-book-theme="dark"\]\)/);
  assert.match(rules[1].selector, /\[data-book-theme="light"\]/);
  assert.equal(rules[1].parent.params, '(orientation: landscape)');
  assert.equal(rules[1].parent.parent.params, '(min-width: 50rem)');
});

test('published CSS has no BOM corruption and guards compatibility search surfaces and dark gradients', async () => {
  const css = await readFile(new URL('../dist/styles.css', import.meta.url), 'utf8');
  assert.doesNotMatch(css, /\uFEFF/);
  assert.match(css, /--font-size-smaller:/);
  const tree = postcss.parse(css);
  const searchSurfaces = [];
  tree.walkRules((rule) => {
    if (rule.selector.includes('#search-dialog')) {
      rule.walkDecls('background-color', (declaration) => {
        if (declaration.value === '#303030') searchSurfaces.push(rule);
      });
    }
  });
  // Search is a remaining generic Book feature; business-page gradients are gone.
  assert.equal(searchSurfaces.length, 2);
  const automatic = searchSurfaces.filter(inColorMedia);
  const manual = searchSurfaces.filter((rule) => !inColorMedia(rule));
  assert.equal(automatic.length, 1);
  assert.equal(manual.length, 1);
  for (const rule of automatic) assert.match(rule.selector, /:not\(\[data-book-theme="light"\]\)/);
  for (const rule of manual) assert.match(rule.selector, /\[data-book-theme="dark"\]/);

  // Keep checking any future compatibility gradient placed in a dark media rule,
  // without requiring the theme to ship a timeline or portfolio gradient.
  tree.walkDecls((declaration) => {
    if (!declaration.value.includes('gradient(')) return;
    const rule = declaration.parent;
    for (let parent = rule.parent; parent; parent = parent.parent) {
      if (parent.type === 'atrule' && parent.name === 'media' && /prefers-color-scheme:\s*dark/.test(parent.params)) {
        assert.match(rule.selector, /:not\(\[data-book-theme="light"\]\)/);
      }
    }
  });
});

test('every rule in a media group receives an explicit override', () => {
  const output = postcss.parse(expandColorSchemes('@media (prefers-color-scheme: dark) { :where([data-astro-book]) .first { color: white; } :where([data-astro-book]) .second { background: black; } }'));
  const rules = [];
  output.walkRules((rule) => rules.push(rule));
  assert.equal(rules.length, 4);
  assert.equal(rules.filter((rule) => !inColorMedia(rule)).length, 2);
});
