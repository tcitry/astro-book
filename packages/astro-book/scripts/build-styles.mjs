import { readFile, writeFile, mkdir, cp, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createRequire } from 'node:module';
import * as sass from 'sass';
import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';
import { compile } from '@tailwindcss/node';
import { Scanner } from '@tailwindcss/oxide';
import { expandColorSchemes } from './color-scheme.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = path.join(root, 'src');
const destination = path.join(root, 'dist');
const require = createRequire(import.meta.url);
await mkdir(destination, { recursive: true });

// Zero-specificity scoping preserves the legacy cascade while keeping the theme
// and its Markdown rules out of independently styled framework islands.
const visited = new WeakSet();
const scope = (css, excludeIslands = true) => postcss([{
  postcssPlugin: 'astro-book-boundary',
  Rule(rule) {
    if (visited.has(rule)) return;
    visited.add(rule);
    if (!rule.selector || rule.parent?.type === 'atrule' && /keyframes$/.test(rule.parent.name)) return;
    rule.selector = selectorParser((selectors) => selectors.each((selector) => {
      const first = selector.nodes[0];
      if (first?.value === ':root' || first?.type === 'tag' && first.value === 'html') {
        first.replaceWith(selectorParser.pseudo({ value: ':where(html[data-astro-book])' }));
      } else if (first?.value === ':host') {
        first.replaceWith(selectorParser.pseudo({ value: ':where(html[data-astro-book])' }));
      } else {
        selector.prepend(selectorParser.combinator({ value: ' ' }));
        selector.prepend(selectorParser.pseudo({ value: ':where([data-astro-book])' }));
      }
      if (excludeIslands) {
        const boundary = selectorParser.pseudo({ value: ':where(:not([data-book-island], [data-book-island] *, [data-demo], [data-demo] *))' });
        const pseudoElement = selector.nodes.findLast((node) => node.type === 'pseudo' && node.value.startsWith('::'));
        if (pseudoElement) selector.insertBefore(pseudoElement, boundary);
        else selector.append(boundary);
      }
    })).processSync(rule.selector);
  },
}]).process(css.replace(/^\uFEFF/, ''), { from: undefined }).css;

const legacy = sass.compile(path.join(source, 'styles/compat/book.scss'), {
  style: 'compressed', charset: false, silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'if-function'],
}).css;
const compiler = await compile(await readFile(path.join(source, 'styles/tailwind.css'), 'utf8'), {
  base: path.join(source, 'styles'), onDependency() {},
});
const scanner = new Scanner({ sources: [{ base: source, pattern: '**/*.{astro,ts,css}', negated: false }] });
const utilities = compiler.build(scanner.scan());
const reading = await readFile(path.join(source, 'styles/reading.css'), 'utf8');
const katexRoot = path.dirname(require.resolve('katex/package.json'));
const katex = await readFile(path.join(katexRoot, 'dist/katex.min.css'), 'utf8');
await cp(path.join(katexRoot, 'dist/fonts'), path.join(destination, 'fonts'), { recursive: true });
await cp(path.join(katexRoot, 'LICENSE'), path.join(destination, 'KATEX-LICENSE'));
await writeFile(path.join(destination, 'styles.css'), [
  '/*! @tcitry/astro-book | MIT | Hugo Book attribution: THIRD_PARTY_NOTICES.md */',
  scope(utilities, false), expandColorSchemes(scope(legacy)), scope(reading), scope(katex, false),
].join('\n'));
console.log('Built complete Book CSS, package-owned Tailwind utilities, and KaTeX fonts.');
