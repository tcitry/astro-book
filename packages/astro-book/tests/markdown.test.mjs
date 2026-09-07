import assert from 'node:assert/strict';
import test from 'node:test';
import { createBookMarkdownRenderer, createBookProcessor } from '../src/markdown/index.ts';
import astroBook from '../src/integration.ts';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

const render = await createBookMarkdownRenderer({ math: { macros: { '\\RR': '\\mathbb{R}' } } });

test('build-time math supports macros, inline/display mode, and readable error fallback', async () => {
  const { html } = await render('Inline $x \\in \\RR$.\n\n$$\n\\int_0^1 x^2\\,dx=\\frac{1}{3}\n$$\n\n$\\unknowncommand{x}$');
  assert.match(html, /class="katex"/);
  assert.match(html, /class="katex-display"/);
  assert.match(html, /mathvariant="double-struck">R/);
  assert.match(html, /unknowncommand/);
  assert.doesNotMatch(html, /<script/);
});

test('strict authoring mode can fail a build on invalid math', async (context) => {
  context.mock.method(console, 'error', () => {});
  const strict = await createBookMarkdownRenderer({ math: { throwOnError: true } });
  await assert.rejects(() => strict('$\\unknowncommand{x}$'), /Could not render math with KaTeX/);
});

test('Mermaid source remains escaped, readable, and carries one runtime configuration', async () => {
  const diagram = await createBookMarkdownRenderer({ mermaid: { flowchart: { useMaxWidth: false } } });
  const { html } = await diagram('```mermaid\nflowchart LR\n A["<script>unsafe</script>"] --> B\n```');
  assert.match(html, /<pre class="mermaid" data-book-mermaid/);
  assert.match(html, /data-book-mermaid-config=/);
  assert.match(html, /&#x3C;script>|&lt;script>/);
  assert.doesNotMatch(html, /<script>|astro-code/);
  assert.equal((html.match(/data-book-mermaid-config=/g) ?? []).length, 1);
});

test('code highlighting, headings, table overflow and trusted raw HTML survive one pipeline', async () => {
  const { html, headings } = await render('# Title\n\n```ts\nconst answer = 42;\n```\n\n| Value |\n| --- |\n| 42 |\n\n<iframe title="Demo" src="/demo/"></iframe>');
  assert.equal(headings[0].slug, 'title');
  assert.match(html, /astro-code/);
  assert.match(html, /data-book-code/);
  assert.match(html, /class="table-scroll"/);
  assert.match(html, /<th scope="col">/);
  assert.match(html, /<iframe title="Demo" src="\/demo\/">/);
  assert.match(html, /--shiki-dark/);
});

test('consumer plugins and managed math plugins are not registered twice', async () => {
  let runs = 0;
  function consumerPlugin() { return () => { runs++; }; }
  const processor = createBookProcessor({
    remarkPlugins: [remarkMath, consumerPlugin, consumerPlugin],
    rehypePlugins: [rehypeKatex, rehypeKatex],
  });
  const renderer = await processor.createRenderer({});
  const result = await renderer.render('$E=mc^2$');
  assert.equal(runs, 1);
  assert.equal((result.code.match(/class="katex"/g) ?? []).length, 1);
});

test('integration reuses an existing MDX integration and composes existing unified plugins', () => {
  function extra() { return () => {}; }
  const config = {
    integrations: [{ name: '@astrojs/mdx' }],
    markdown: { processor: unified({ remarkPlugins: [extra] }), remarkPlugins: [], rehypePlugins: [] },
  };
  const updates = [];
  astroBook({ markdown: { remarkPlugins: [extra] } }).hooks['astro:config:setup']({ config, updateConfig: (value) => { updates.push(value); return config; } });
  assert.equal(updates.length, 0);
  assert.equal(config.markdown.processor.options.remarkPlugins.filter((entry) => entry === extra).length, 1);
  assert.equal(typeof config.markdown.processor.createMdxRenderer, 'function');
});

test('MDX inherits Mermaid and KaTeX from the same processor', async () => {
  const processor = createBookProcessor({ math: { macros: { '\\RR': '\\mathbb{R}' } } });
  const mdx = await processor.createMdxRenderer({}, { optimize: false });
  const result = await mdx.process('$x \\in \\RR$\n\n```mermaid\nflowchart LR\n A --> B\n```\n\n```js\nconsole.log(42)\n```', '/synthetic.mdx', {});
  assert.match(result.code, /katex/);
  assert.match(result.code, /data-book-mermaid/);
  assert.match(result.code, /data-book-code/);
  assert.doesNotMatch(result.code, /hydrate|react-dom/);
});

// Astro normalizes its built-in Satteri processor before integrations run.
test('integration replaces the built-in default processor and installs MDX once', () => {
  const config = { integrations: [], markdown: { processor: { name: 'satteri', options: {} }, remarkPlugins: [], rehypePlugins: [] } };
  const added = [];
  astroBook().hooks['astro:config:setup']({ config, updateConfig: (value) => { added.push(...(value.integrations ?? [])); return config; } });
  assert.equal(config.markdown.processor.name, 'unified');
  assert.deepEqual(added.map((entry) => entry.name), ['@astrojs/mdx']);
});

test('string plugin names cannot silently diverge between Markdown and MDX', () => {
  assert.throws(() => createBookProcessor({ remarkPlugins: ['remark-example'] }), /Import plugin functions/);
});

test('mermaid:false keeps highlighted Markdown source explicitly disabled for the runtime', async () => {
  const renderDisabled = await createBookMarkdownRenderer({ mermaid: false });
  const { html } = await renderDisabled('```mermaid\nflowchart LR\n A --> B\n```');
  assert.match(html, /data-book-mermaid-disabled/);
  assert.match(html, /data-language="mermaid"/);
  assert.match(html, /astro-code/);
  assert.doesNotMatch(html, /class="mermaid"|data-book-mermaid=/);
});

test('mermaid:false marks fences disabled without syntax highlighting and in MDX', async () => {
  const processor = createBookProcessor({ mermaid: false });
  const renderer = await processor.createRenderer({ syntaxHighlight: false });
  const markdown = await renderer.render('```mermaid\nflowchart LR\n A --> B\n```');
  assert.match(markdown.code, /data-book-mermaid-disabled/);
  assert.match(markdown.code, /language-mermaid/);
  const mdx = await processor.createMdxRenderer({}, { optimize: false });
  const result = await mdx.process('```mermaid\nflowchart LR\n A --> B\n```', '/disabled.mdx', {});
  assert.match(result.code, /data-book-mermaid-disabled/);
  assert.doesNotMatch(result.code, /"data-book-mermaid":/);
});

test('integration mermaid:false disables rendering without a separate layout setting', async () => {
  const config = { integrations: [{ name: '@astrojs/mdx' }], markdown: { processor: { name: 'satteri', options: {} }, remarkPlugins: [], rehypePlugins: [] } };
  astroBook({ mermaid: false }).hooks['astro:config:setup']({ config, updateConfig: () => config });
  const renderer = await config.markdown.processor.createRenderer({});
  const result = await renderer.render('```mermaid\nflowchart LR\n A --> B\n```');
  assert.match(result.code, /data-book-mermaid-disabled/);
});
