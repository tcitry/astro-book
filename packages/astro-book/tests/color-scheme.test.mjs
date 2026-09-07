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
  const output = postcss.parse(expandColorSchemes('\uFEFF@media (prefers-color-scheme: dark) { :where(html[data-astro-book]) .tag-0 { background: linear-gradient(black, gray); } }'));
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
  const output = postcss.parse(expandColorSchemes('@media (min-width: 50rem) { @media (prefers-color-scheme: light) { @media (orientation: landscape) { :where([data-astro-book]) .weekly-title { color: teal; } } } }'));
  const rules = [];
  output.walkRules((rule) => rules.push(rule));
  assert.equal(rules.length, 2);
  assert.match(rules[0].selector, /:not\(\[data-book-theme="dark"\]\)/);
  assert.match(rules[1].selector, /\[data-book-theme="light"\]/);
  assert.equal(rules[1].parent.params, '(orientation: landscape)');
  assert.equal(rules[1].parent.parent.params, '(min-width: 50rem)');
});

test('published CSS has no BOM selector corruption and guards every compatibility dark gradient', async () => {
  const css = await readFile(new URL('../dist/styles.css', import.meta.url), 'utf8');
  assert.doesNotMatch(css, /\uFEFF/);
  assert.match(css, /--font-size-smaller:/);
  const tree = postcss.parse(css);
  const gradients = [];
  tree.walkRules((rule) => {
    if (rule.selector.includes('.tag-0')) {
      rule.walkDecls('background', (declaration) => {
        if (declaration.value.includes('#4a5759')) gradients.push(rule);
      });
    }
  });
  assert.ok(gradients.length >= 2);
  const automatic = gradients.filter(inColorMedia);
  const manual = gradients.filter((rule) => !inColorMedia(rule));
  assert.equal(automatic.length, manual.length);
  for (const rule of automatic) assert.match(rule.selector, /:not\(\[data-book-theme="light"\]\)/);
  for (const rule of manual) assert.match(rule.selector, /\[data-book-theme="dark"\]/);
});

test('every rule in a media group receives an explicit override', () => {
  const output = postcss.parse(expandColorSchemes('@media (prefers-color-scheme: dark) { :where([data-astro-book]) .first { color: white; } :where([data-astro-book]) .second { background: black; } }'));
  const rules = [];
  output.walkRules((rule) => rules.push(rule));
  assert.equal(rules.length, 4);
  assert.equal(rules.filter((rule) => !inColorMedia(rule)).length, 2);
});
