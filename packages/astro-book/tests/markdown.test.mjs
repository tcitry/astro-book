import assert from 'node:assert/strict';
import test from 'node:test';
import { createBookMarkdownRenderer, createBookProcessor } from '../src/markdown/index.ts';
import astroBook from '../src/integration.ts';
import { unified, markdownConfigDefaults } from '@astrojs/markdown-remark';
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
  assert.doesNotMatch(html.replace(/"[^"]*"/g, '""'), /<script>|astro-code/);
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
  assert.match(html, /<span style="color:/);
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


function codeTexts(html) {
  const entities = { amp: '&', quot: '"', lt: '<', gt: '>', apos: "'" };
  return [...html.matchAll(/<pre\b[^>]*>[\s\S]*?<code\b[^>]*>([\s\S]*?)<\/code>[\s\S]*?<\/pre>/g)].map((match) => match[1]
    .replace(/<[^>]*>/g, '')
    .replace(/&#x([0-9a-f]+);/gi, (_, value) => String.fromCodePoint(parseInt(value, 16)))
    .replace(/&#([0-9]+);/g, (_, value) => String.fromCodePoint(Number(value)))
    .replace(/&(amp|quot|lt|gt|apos);/g, (_, name) => entities[name]));
}

test('static highlighted code retains visible comments, tabs, blank lines and trailing spaces', async () => {
  const source = '\n# setup instructions\n\tprintf "a & b"  \n\n';
  const { html } = await render('```bash\n' + source + '```');
  // Astro's native highlighter removes the fence's final newline, not authored blank lines.
  assert.deepEqual(codeTexts(html), [source.slice(0, -1)]);
  assert.match(html, /astro-code/);
  assert.doesNotMatch(html, /data-code=|<button|<script/);
});

test('trusted raw HTML code remains readable while framework islands keep ownership', async () => {
  const source = '// example.js\nconst raw = "a & b";';
  const { html } = await render('<pre><code class="language-js">// example.js\nconst raw = "a &amp; b";</code></pre>\n\n<div data-demo="island"><pre><code>owned by a demo</code></pre></div>\n\n<div data-book-island><pre><code>owned by an island</code></pre></div>');
  assert.deepEqual(codeTexts(html), [source, 'owned by a demo', 'owned by an island']);
  assert.equal((html.match(/data-book-code=/g) ?? []).length, 1);
  assert.match(html, /<div data-demo="island"><pre><code>owned by a demo<\/code><\/pre><\/div>/);
  assert.match(html, /<div data-book-island=""><pre><code>owned by an island<\/code><\/pre><\/div>/);
  assert.doesNotMatch(html, /astro-code|<button|<script/);
});

test('Mermaid preserves escaped source without highlighted spans or a second source attribute', async () => {
  const source = 'flowchart LR\n A["<script>text</script>"] --> B';
  const { html } = await render('```mermaid\n' + source + '\n```');
  assert.deepEqual(codeTexts(html), [source]);
  assert.match(html, /<pre class="mermaid"[^>]*><code>/);
  assert.doesNotMatch(html, /astro-code|<span|data-code=|<script>/);
});

test('consumer Shiki transformers retain their output and readable code', async () => {
  const options = { shikiConfig: { transformers: [{
    name: 'test-preserved-transformer', pre(node) { node.properties['data-custom-highlight'] = 'kept'; },
  }] } };
  const transformed = await createBookMarkdownRenderer(options);
  const { html } = await transformed('```js\nconsole.log(1)\n```');
  assert.match(html, /data-custom-highlight="kept"/);
  assert.match(html, /astro-code/);
  assert.deepEqual(codeTexts(html), ['console.log(1)']);
  const mdx = await createBookProcessor(options).createMdxRenderer({}, { optimize: false });
  const compiled = await mdx.process('```js\nconsole.log(1)\n```', '/transformer.mdx', {});
  assert.match(compiled.code, /"data-custom-highlight": "kept"/);
  assert.match(compiled.code, /astro-code/);
});

test('filename comments remain visible source instead of becoming a header', async () => {
  const { html } = await render('```js\n// example.js\nconsole.log(42);\n```');
  assert.deepEqual(codeTexts(html), ['// example.js\nconsole.log(42);']);
  assert.doesNotMatch(html, /<figcaption|data-code=/);
});

test('MDX JSX islands are not transformed by the reading-code processor', async () => {
  const mdx = await createBookProcessor().createMdxRenderer({}, { optimize: false });
  for (const marker of ['data-demo', 'data-book-island']) {
    const result = await mdx.process(`<div ${marker}="owned"><pre><code>owned by React</code></pre></div>`, '/island.mdx', {});
    assert.doesNotMatch(result.code, /data-book-code|astro-code/);
    assert.match(result.code, /owned by React/);
  }
});

test('Astro language exclusions keep source readable without coloring the excluded fence', async () => {
  const processor = createBookProcessor();
  const renderer = await processor.createRenderer({ syntaxHighlight: { type: 'shiki', excludeLangs: ['js'] } });
  const source = 'const answer = 42;';
  const { code } = await renderer.render('```js\n' + source + '\n```\n\n```ts\n' + source + '\n```');
  const blocks = [...code.matchAll(/<pre\b[^>]*>[\s\S]*?<\/pre>/g)].map(([value]) => value);
  assert.equal(blocks.length, 2);
  assert.match(blocks[0], /language-js/);
  assert.doesNotMatch(blocks[0], /<span|astro-code/);
  assert.match(blocks[1], /astro-code/);
  assert.match(blocks[1], /<span style="color:/);
  assert.deepEqual(codeTexts(code), [source + '\n', source]);
});

test('Astro language exclusions also apply to MDX without disabling other languages', async () => {
  const processor = createBookProcessor();
  const mdx = await processor.createMdxRenderer({ syntaxHighlight: { type: 'shiki', excludeLangs: ['js'] } }, { optimize: false });
  const excluded = await mdx.process('```js\nconst answer = 42;\n```', '/excluded.mdx', {});
  assert.match(excluded.code, /data-book-code/);
  assert.match(excluded.code, /language-js/);
  assert.doesNotMatch(excluded.code, /_components\.span|astro-code/);
  const included = await mdx.process('```ts\nconst answer = 42;\n```', '/included.mdx', {});
  assert.match(included.code, /_components\.span/);
  assert.match(included.code, /astro-code/);
});

test('code:false disables ordinary enhancement while preserving highlighting, math and Mermaid', async () => {
  let runs = 0;
  const custom = await createBookMarkdownRenderer({ code: false, rehypePlugins: [() => () => { runs++; }] });
  const { html } = await custom('```ts\nconst x = 1;\n```\n\n$x^2$\n\n```mermaid\ngraph TD\n A-->B\n```\n\n<pre><code>raw source</code></pre>');
  assert.equal(runs, 1);
  assert.match(html, /astro-code/);
  assert.equal((html.match(/data-book-code-disabled=/g) ?? []).length, 2);
  assert.match(html, /class="katex"/);
  const diagram = html.match(/<pre class="mermaid"[\s\S]*?<\/pre>/)?.[0] ?? '';
  assert.match(diagram, /data-book-mermaid/);
  assert.doesNotMatch(diagram, /data-book-code-disabled/);
  assert.doesNotMatch(html, /<button|data-code=/);
});

test('syntaxHighlight:false preserves plain source in Markdown and MDX with code:false', async () => {
  const processor = createBookProcessor({ code: false });
  const source = '\t# comment\n  echo hi  \n\n';
  const input = '```bash\n' + source + '```';
  const renderer = await processor.createRenderer({ syntaxHighlight: false });
  const result = await renderer.render(input);
  assert.deepEqual(codeTexts(result.code), [source]);
  assert.match(result.code, /data-book-code-disabled/);
  assert.doesNotMatch(result.code, /astro-code|<span|<button/);
  const mdx = await processor.createMdxRenderer({ syntaxHighlight: false }, { optimize: false });
  const compiled = await mdx.process(input, '/synthetic.mdx', {});
  assert.match(compiled.code, /data-book-code-disabled/);
  assert.match(compiled.code, /language-bash/);
  assert.ok(compiled.code.includes(JSON.stringify(source)));
  assert.doesNotMatch(compiled.code, /astro-code|_components\.span/);
});

test('syntaxHighlight:false keeps default code enhancement available without loading a highlighter', async () => {
  const renderer = await createBookProcessor().createRenderer({ syntaxHighlight: false });
  const { code } = await renderer.render('```js\nconst plain = 1;\n```');
  assert.deepEqual(codeTexts(code), ['const plain = 1;\n']);
  assert.match(code, /data-book-code=/);
  assert.doesNotMatch(code, /astro-code|data-book-code-disabled|<span/);
});

test('native Shiki themes and wrapping compose with normalized defaults in Markdown and MDX', async () => {
  const processor = createBookProcessor({ shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' }, wrap: true } });
  const source = '```ts\nconst greeting = "Hello";\n```';
  const renderer = await processor.createRenderer(markdownConfigDefaults);
  const markdown = await renderer.render(source);
  assert.match(markdown.code, /astro-code-themes github-light github-dark/);
  assert.match(markdown.code, /--shiki-dark/);
  assert.match(markdown.code, /white-space: pre-wrap/);
  assert.deepEqual(codeTexts(markdown.code), ['const greeting = "Hello";']);
  const mdx = await processor.createMdxRenderer(markdownConfigDefaults, { optimize: false });
  const compiled = await mdx.process(source, '/themes.mdx', {});
  assert.match(compiled.code, /astro-code-themes github-light github-dark/);
  assert.match(compiled.code, /--shiki-dark/);
  assert.match(compiled.code, /whiteSpace: "pre-wrap"/);
});

test('an explicit Shiki theme overrides inherited light/dark themes', async () => {
  const processor = createBookProcessor({ shikiConfig: { theme: 'nord' } });
  const renderer = await processor.createRenderer({ shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' } } });
  const { code } = await renderer.render('```ts\nconst answer = 42;\n```');
  assert.match(code, /astro-code nord/);
  assert.doesNotMatch(code, /github-light|github-dark|--shiki-dark/);
});

test('old frame and line-marker metadata does not create undocumented code UI', async () => {
  const source = '```ts frame="code" title="greeting.ts" {2}\nexport function greet() {\n  return "Hello";\n}\n```';
  const processor = createBookProcessor();
  const renderer = await processor.createRenderer(markdownConfigDefaults);
  const markdown = await renderer.render(source);
  assert.match(markdown.code, /astro-code/);
  assert.deepEqual(codeTexts(markdown.code), ['export function greet() {\n  return "Hello";\n}']);
  assert.doesNotMatch(markdown.code, /<figcaption|class="frame|ec-line|data-code=/);
  const mdx = await processor.createMdxRenderer(markdownConfigDefaults, { optimize: false });
  const compiled = await mdx.process(source, '/legacy-metadata.mdx', {});
  assert.match(compiled.code, /astro-code/);
  assert.doesNotMatch(compiled.code, /class: "frame|ec-line|"data-code":/);
});

test('island markers directly on pre preserve ownership and Mermaid source', async () => {
  const {html} = await render('<pre data-book-island><code class="language-mermaid">graph TD\n A--&gt;B</code></pre>');
  assert.match(html, /<pre data-book-island/);
  assert.doesNotMatch(html, /data-book-mermaid|data-book-code=/);
});

test('disabling both code enhancement and Mermaid leaves ordinary code disabled', async () => {
  const disabled = await createBookMarkdownRenderer({code: false, mermaid: false});
  const {html} = await disabled('```mermaid\ngraph TD\n A-->B\n```');
  assert.match(html, /data-book-mermaid-disabled/);
  assert.match(html, /data-book-code-disabled/);
  assert.doesNotMatch(html, /<pre class="mermaid"/);
});
