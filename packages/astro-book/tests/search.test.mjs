import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { createIndex } from 'pagefind';
import astroBook from '../src/integration.ts';
import { buildSearchIndex } from '../src/search/index.ts';

async function fixture(context) {
  const root = await mkdtemp(join(tmpdir(), 'astro-book-search-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  const output = join(root, 'custom-output');
  await mkdir(output);
  for (const [path, title, content] of [
    ['docs/guide/index.html', 'Guide', 'quasistellar navigation'],
    ['posts/article/index.html', 'Article', 'interstellar migration'],
    ['lab/index.html', 'Experiment', 'independent island'],
  ]) {
    const file = join(output, path);
    await mkdir(join(file, '..'), { recursive: true });
    await writeFile(file, `<html lang="en"><head><title>${title}</title></head><body><nav>sidebar-only-sentinel</nav><main data-pagefind-body><h1 data-pagefind-meta="title">${title}</h1><p>${content}</p><span data-pagefind-ignore>ignored-button-sentinel</span></main></body></html>`);
  }
  return { root, output, dir: pathToFileURL(output + '/') };
}

async function fragments(output) {
  const directory = join(output, 'pagefind/fragment');
  return Promise.all((await readdir(directory)).map(async (name) => {
    const decoded = gunzipSync(await readFile(join(directory, name))).toString();
    return JSON.parse(decoded.slice(decoded.indexOf('{')));
  }));
}

test("the integration builds the default static search bundle in Astro's actual output directory", async (context) => {
  const { output, dir } = await fixture(context);
  const messages = [];
  await astroBook().hooks['astro:build:done']({ dir, logger: { info: (message) => messages.push(message) } });
  for (const name of ['pagefind.js', 'pagefind-ui.js', 'pagefind-ui.css', 'pagefind-entry.json']) {
    assert.ok((await stat(join(output, 'pagefind', name))).isFile(), `Missing search asset: ${name}`);
  }
  const entry = JSON.parse(await readFile(join(output, 'pagefind/pagefind-entry.json'), 'utf8'));
  assert.equal(entry.languages.en.page_count, 3);
  assert.ok(messages.some((message) => message.includes('3 HTML pages')));
  const records = await fragments(output);
  assert.deepEqual(records.map((record) => record.url).sort(), ['/docs/guide/', '/lab/', '/posts/article/']);
  assert.deepEqual(records.map((record) => record.meta.title).sort(), ['Article', 'Experiment', 'Guide']);
  assert.doesNotMatch(records.map((record) => record.content).join(' '), /sidebar-only-sentinel|ignored-button-sentinel/);
});

test('consumer scope excludes unrelated pages without changing their output', async (context) => {
  const { output, dir } = await fixture(context);
  await astroBook({ search: { glob: '{docs,posts}/**/*.html' } }).hooks['astro:build:done']({ dir, logger: { info() {} } });
  const records = await fragments(output);
  assert.deepEqual(records.map((record) => record.url).sort(), ['/docs/guide/', '/posts/article/']);
  assert.ok((await stat(join(output, 'lab/index.html'))).isFile());
});

test('search:false leaves the build free of generated search assets', async (context) => {
  const { output, dir } = await fixture(context);
  await astroBook({ search: false }).hooks['astro:build:done']({ dir, logger: { info() { assert.fail('Disabled indexing must not report a build'); } } });
  await assert.rejects(stat(join(output, 'pagefind')), { code: 'ENOENT' });
});

test('invalid indexing scope fails the build without publishing a search bundle', async (context) => {
  const { output, dir } = await fixture(context);
  await assert.rejects(buildSearchIndex(dir, { glob: '[' }), /Pagefind could not index the generated HTML/);
  await assert.rejects(stat(join(output, 'pagefind')), { code: 'ENOENT' });
});

test('freeing the theme index leaves indexes owned by other integrations usable', async (context) => {
  const { dir } = await fixture(context);
  const { index, errors } = await createIndex();
  assert.deepEqual(errors, []);
  assert.ok(index);
  try {
    await index.addCustomRecord({ url: '/external/', content: 'Another integration owns this record', language: 'en', meta: { title: 'External' } });
    await buildSearchIndex(dir);
    const result = await index.getFiles();
    assert.deepEqual(result.errors, []);
    assert.ok(result.files.some((file) => file.path === 'pagefind-entry.json'));
  } finally {
    await index.deleteIndex();
  }
});


test('consumer root selectors retain indexing boundaries for pages without body markers', async (context) => {
  const { output, dir } = await fixture(context);
  for (const path of ['docs/guide/index.html', 'posts/article/index.html', 'lab/index.html']) {
    const file = join(output, path);
    await writeFile(file, (await readFile(file, 'utf8')).replace(' data-pagefind-body', ''));
  }
  await buildSearchIndex(dir, { rootSelector: 'main' });
  const records = await fragments(output);
  assert.equal(records.length, 3);
  assert.ok(records.some((record) => record.content.includes('quasistellar')));
  assert.doesNotMatch(records.map((record) => record.content).join(' '), /sidebar-only-sentinel|ignored-button-sentinel/);
});
