import { mkdtemp, readFile, writeFile, readdir, stat, cp, mkdir, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import assert from 'node:assert/strict';

const root = fileURLToPath(new URL('../', import.meta.url));
const packageRoot = path.join(root, 'packages/astro-book');
const releaseArtifact = path.join(root, '.artifacts/astro-book.tgz');
// A failed verification must not leave an older package ready for publication.
await rm(releaseArtifact, { force: true });
const temporary = await mkdtemp(path.join(tmpdir(), 'astro-book-packed-'));
const consumer = path.join(temporary, 'consumer');
const cleanEnvironment = { ...process.env, NPM_CONFIG_USERCONFIG: path.join(temporary, 'public.npmrc') };
for (const name of Object.keys(cleanEnvironment)) if (/(?:^|_)(?:AUTH|TOKEN|SECRET|PASSWORD)(?:_|$)/i.test(name)) delete cleanEnvironment[name];
await writeFile(cleanEnvironment.NPM_CONFIG_USERCONFIG, 'registry=https://registry.npmjs.org/\n');

function run(command, args, cwd, capture = false) {
  console.log(`> ${command} ${args.join(' ')}`);
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, { cwd, env: cleanEnvironment, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '', stderr = '';
    process.stdout.on('data', (chunk) => { stdout += chunk; if (!capture) globalThis.process.stdout.write(chunk); });
    process.stderr.on('data', (chunk) => { stderr += chunk; if (!capture) globalThis.process.stderr.write(chunk); });
    process.on('error', reject);
    process.on('close', (code) => code === 0 ? resolve(stdout) : reject(new Error(`${command} exited ${code}\n${stderr}\n${stdout}`)));
  });
}

const privateMaterial = /@heroui-pro\/|heroui-pro(?:@|\/|\")|\/Users\/|\.generated\/content\.json/;
const forbidden = new RegExp(`${privateMaterial.source}|tcitry\\.github\\.io`);
const packOutput = await run('npm', ['pack', '--json', '--pack-destination', temporary], packageRoot, true);
const metadata = JSON.parse(packOutput.slice(packOutput.indexOf('[{') >= 0 ? packOutput.indexOf('[{') : packOutput.indexOf('[\n')))[0];
assert.ok(metadata.filename, 'npm pack must produce a tarball');
const files = metadata.files.map((file) => file.path);
assert.equal(metadata.name, 'astro-book', 'Only the public theme may be published');
assert.ok(files.includes('README.md'), 'npm consumers need the packaged setup guide');
const packageManifest = JSON.parse(await readFile(path.join(packageRoot, 'package.json'), 'utf8'));
assert.equal(packageManifest.publishConfig?.access, 'public');
assert.equal(packageManifest.publishConfig?.registry, 'https://registry.npmjs.org/');
for (const filename of files) {
  assert.ok(!/(^|\/)(?:node_modules|\.env[^/]*|\.generated|\.git|\.npmrc|\.dev\.vars)(\/|$)/.test(filename), `Unpublishable path: ${filename}`);
  if (/\.(?:ts|js|mjs|astro|json|css|scss|md)$/.test(filename)) {
    const source = await readFile(path.join(packageRoot, filename), 'utf8');
    // Metadata may link to the public docs; runtime code must not embed a site identity.
    const blocked = ['README.md', 'package.json'].includes(filename) ? privateMaterial : forbidden;
    assert.ok(!blocked.test(source), `Package contains site-specific or commercial material: ${filename}`);
  }
}
for (const filename of ['dist/styles.css', 'src/components/BookLayout.astro', 'src/markdown/index.ts', 'src/client/code-copy.js', 'src/styles/Code.css', 'LICENSE', 'THIRD_PARTY_NOTICES.md', 'src/styles/Shell.module.css', 'src/styles/Reading.module.css', 'src/assets/HUGO-BOOK-LICENSE', 'src/assets/MODERN-NORMALIZE-LICENSE']) assert.ok(files.includes(filename), `Missing packed file: ${filename}`);
assert.ok(!files.some((file) => /EXPRESSIVE-CODE|code-copy-template|code-styles/.test(file)), 'Retired Expressive Code assets must not be packaged');
assert.ok(!files.some((file) => /\.scss$|styles\/compat\//.test(file)), 'The retired Sass compatibility layer must not be published');
assert.ok(files.some((file) => /\.woff2?$/.test(file)), 'Packed package must contain font assets');
const packedCSS = await readFile(path.join(packageRoot, 'dist/styles.css'), 'utf8');
assert.ok(!packedCSS.includes('\uFEFF'), 'Compiled CSS must not contain a BOM that can invalidate a later selector');
assert.match(packedCSS, /--font-size\s*:\s*16px\s*;/, 'Book root font size must be packaged');
assert.match(packedCSS, /--font-size-smaller\s*:\s*0?\.875rem\s*;/, 'Book navigation must retain its 14px equivalent smaller size');
assert.match(packedCSS, /font-size\s*:\s*var\(--font-size-smaller\)/, 'The smaller font token must remain applied');


await cp(path.join(root, 'examples/basic'), consumer, {
  recursive: true,
  filter: (source) => !path.relative(path.join(root, 'examples/basic'), source).split(path.sep).some((part) => ['node_modules', 'dist', '.astro'].includes(part)),
});
const manifest = JSON.parse(await readFile(path.join(consumer, 'package.json'), 'utf8'));
manifest.name = 'astro-book-packed-consumer';
manifest.dependencies['astro-book'] = `file:${path.join(temporary, metadata.filename)}`;
assert.ok(!Object.hasOwn(manifest.dependencies ?? {}, 'pagefind') && !Object.hasOwn(manifest.devDependencies ?? {}, 'pagefind'), 'Consumers must not install Pagefind directly');
assert.equal(manifest.scripts.build, 'astro build', 'An ordinary Astro build must generate the search index automatically');
assert.ok(!Object.keys({ ...manifest.dependencies, ...manifest.devDependencies }).some((name) => name.includes('tailwind') || /heroui-pro/i.test(name)), 'Packed consumer may not provide a Tailwind compiler or commercial dependencies');
await writeFile(path.join(consumer, 'package.json'), JSON.stringify(manifest, null, 2) + '\n');
await run('npm', ['install', '--no-audit', '--no-fund'], consumer);
const lock = await readFile(path.join(consumer, 'package-lock.json'), 'utf8');
assert.ok(!/@heroui-pro|node_modules\/heroui-pro/.test(lock), 'Isolated install must have no commercial component package');
await run('npm', ['run', 'check'], consumer);
await run('npm', ['run', 'build'], consumer);

const output = path.join(consumer, 'dist');
const { default: exampleConfig } = await import(pathToFileURL(path.join(consumer, 'astro.config.mjs')).href);
const origin = new URL(exampleConfig.site).origin;
const base = `/${(exampleConfig.base ?? '/').replace(/^\/+|\/+$/g, '')}/`.replace(/^\/\//, '/');
function outputURL(filename) {
  return new URL(base + path.relative(output, filename).split(path.sep).join('/').replace(/index\.html$/, ''), origin);
}
function localAsset(value, filename) {
  const url = new URL(value.replace(/&amp;/g, '&'), outputURL(filename));
  if (url.origin !== origin) return;
  assert.ok(url.pathname.startsWith(base), `Link escapes the example base ${base}: ${value}`);
  let relative = decodeURIComponent(url.pathname.slice(base.length));
  if (!relative || relative.endsWith('/')) relative += 'index.html';
  const target = path.resolve(output, relative);
  assert.ok(target.startsWith(output + path.sep), `Asset escapes the output directory: ${value}`);
  return target;
}

const outputFiles = [];
async function walk(directory) {
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const filename = path.join(directory, item.name);
    if (item.isDirectory()) await walk(filename);
    else if (item.isFile()) outputFiles.push(filename);
  }
}
await walk(output);
const htmlFiles = outputFiles.filter((file) => file.endsWith('.html'));
assert.ok(htmlFiles.length >= 3, 'Example must include separate Markdown, MDX and plain pages');
const documents = await Promise.all(htmlFiles.map(async (filename) => ({ filename, html: await readFile(filename, 'utf8') })));
const mathPages = documents.filter(({ html }) => /class="katex"/.test(html));
const searchConfigFromHTML = (html) => {
  const serialized = html.match(/\bdata-book-search-config="([^"]+)"/)?.[1];
  assert.ok(serialized, 'Default search must include its runtime configuration');
  return JSON.parse(serialized.replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'));
};
const hasDiagram = (html) => /<pre\b[^>]*\bdata-book-mermaid(?:=|\s|>)/.test(html);
const diagramPages = documents.filter(({ html }) => hasDiagram(html));
assert.ok(mathPages.length >= 2, 'Markdown and MDX both need build-time math');
assert.ok(diagramPages.length >= 2, 'Markdown and MDX both need the shared Mermaid contract');
assert.ok(documents.some(({ html }) => !hasDiagram(html)), 'Include a page without diagrams to check conditional runtime loading');
assert.ok(documents.some(({ html }) => /data-book-code/.test(html)), 'Example must contain highlighted code');
for (const { filename, html } of documents) {
  assert.equal(searchConfigFromHTML(html).basePath.replace(/\/+$/, ''), `${base}pagefind`, 'Default search assets must follow the Astro base without a layout override');
  assert.ok(!/<astro-island\b/.test(html), `Ordinary reading page must not hydrate a frontend framework: ${path.relative(output, filename)}`);
  assert.ok(!/react(?:-dom)?(?:\.client|[.\/-])/.test(html), 'Ordinary reading pages must not reference React');
  assert.ok(!privateMaterial.test(html), 'Example output contains private or commercial material');
  assert.equal(html.match(/<link\b[^>]+rel="canonical"[^>]+href="([^"]+)"/)?.[1], outputURL(filename).href, 'Every demo page needs its configured canonical origin and base');
  if (!hasDiagram(html)) assert.ok(!/<link\b[^>]+(?:preload|modulepreload)[^>]+mermaid/i.test(html), 'A diagram-free page must not preload Mermaid');
  // Ignore literal attributes inside code-copy payloads when checking real links.
  const markup = html.replace(/data-code="[^"]*"/g, '');
  for (const match of markup.matchAll(/(?:src|href)=["']([^"']+)["']/g)) {
    const url = match[1];
    if (/^(?:data:|#|mailto:|tel:|javascript:)/.test(url)) continue;
    const asset = localAsset(url, filename);
    if (asset) assert.ok((await stat(asset)).isFile(), `Missing linked page or asset: ${url}`);
  }
}
const cssFiles = outputFiles.filter((file) => file.endsWith('.css'));
assert.ok(cssFiles.length, 'Packed CSS must reach the consumer');
let fontLinks = 0;
for (const filename of cssFiles) {
  const css = await readFile(filename, 'utf8');
  assert.ok(!css.includes('\uFEFF'), 'Consumer CSS must not contain an embedded BOM');
  for (const match of css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) {
    const url = match[1];
    if (!/\.(?:woff2?|ttf)(?:[?#].*)?$/.test(url)) continue;
    assert.ok(!/^https?:/.test(url), 'Theme fonts must be supplied by the package');
    const asset = localAsset(url, filename);
    assert.ok(asset && (await stat(asset)).isFile(), `Missing font: ${url}`);
    fontLinks++;
  }
}
assert.ok(fontLinks > 0, 'KaTeX fonts must remain linked after packing');
assert.ok(outputFiles.some((file) => /\.m?js$/.test(file)), 'Theme client assets must be bundled');
for (const filename of ['pagefind/pagefind.js', 'pagefind/pagefind-ui.js', 'pagefind/pagefind-ui.css', 'pagefind/pagefind-entry.json']) {
  assert.ok((await stat(path.join(output, filename))).isFile(), `Missing built search asset: ${filename}`);
}
const searchEntry = JSON.parse(await readFile(path.join(output, 'pagefind/pagefind-entry.json'), 'utf8'));
assert.equal(searchEntry.languages.en.page_count, documents.length, 'Every demo article must be included in the static search index');
// Exercise the generated browser client against the actual emitted index and fragments.
// The localhost server serves only this isolated consumer's output beneath its real base.
const server = createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    assert.ok(pathname.startsWith(base));
    const filename = path.resolve(output, decodeURIComponent(pathname.slice(base.length)));
    assert.ok(filename.startsWith(output + path.sep));
    response.end(await readFile(filename));
  } catch {
    response.writeHead(404);
    response.end();
  }
});
await new Promise((resolve, reject) => {
  server.once('error', reject);
  server.listen(0, '127.0.0.1', resolve);
});
let searchResults;
let pagefind;
let searchTimeout;
try {
  pagefind = await import(pathToFileURL(path.join(output, 'pagefind/pagefind.js')).href);
  const searchBasePath = searchConfigFromHTML(documents[0].html).basePath;
  await pagefind.options({ basePath: `http://127.0.0.1:${server.address().port}${searchBasePath}/`, baseUrl: base });
  searchResults = await Promise.race([
    (async () => {
      const response = await pagefind.search('quadratic');
      return Promise.all(response.results.map((result) => result.data()));
    })(),
    new Promise((_, reject) => { searchTimeout = setTimeout(() => reject(new Error('Built search query timed out')), 30000); }),
  ]);
  const mathResult = searchResults.find((result) => result.url === `${base}math/`);
  assert.ok(mathResult, 'The built index must find the mathematics article for a real query');
  assert.equal(mathResult.meta.title, 'Mathematics', 'Search must retain the indexed article title');
  assert.match(mathResult.excerpt, /<mark>quadratic<\/mark>/i, 'Search must return a highlighted excerpt from indexed content');
  for (const result of searchResults) {
    assert.ok(result.url.startsWith(base), `Search result escapes the configured base: ${result.url}`);
    const asset = localAsset(result.url, documents[0].filename);
    assert.ok(asset && (await stat(asset)).isFile(), `Search result has no emitted page: ${result.url}`);
  }
} finally {
  clearTimeout(searchTimeout);
  await pagefind?.destroy();
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}
const tarball = path.join(temporary, metadata.filename);
const integrity = 'sha512-' + createHash('sha512').update(await readFile(tarball)).digest('base64');
assert.equal(integrity, metadata.integrity, 'Publish the exact bytes installed in the test consumer');
const summary = { package: metadata.filename, version: metadata.version, integrity, packedFiles: files.length, htmlPages: documents.length, mathPages: mathPages.length, diagramPages: diagramPages.length, fontLinks, searchPages: searchEntry.languages.en.page_count, searchQuery: 'quadratic', searchResults: searchResults.map((result) => result.url), base, origin, consumer };
await mkdir(path.join(root, '.artifacts'), { recursive: true });
await writeFile(path.join(root, '.artifacts/packed-consumer.json'), JSON.stringify(summary, null, 2) + '\n');
await cp(tarball, releaseArtifact);
console.log('Packed-package verification passed. Temporary consumer retained for inspection.');
console.log(JSON.stringify(summary, null, 2));
