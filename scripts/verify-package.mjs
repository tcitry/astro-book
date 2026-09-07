import { mkdtemp, readFile, writeFile, readdir, stat, cp, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';

const root = fileURLToPath(new URL('../', import.meta.url));
const packageRoot = path.join(root, 'packages/astro-book');
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
for (const filename of files) {
  assert.ok(!/(^|\/)(?:node_modules|\.env[^/]*|\.generated|\.git|\.npmrc|\.dev\.vars)(\/|$)/.test(filename), `Unpublishable path: ${filename}`);
  if (/\.(?:ts|js|mjs|astro|json|css|scss|md)$/.test(filename)) {
    const source = await readFile(path.join(packageRoot, filename), 'utf8');
    assert.ok(!forbidden.test(source), `Package contains site-specific or commercial material: ${filename}`);
  }
}
for (const filename of ['dist/styles.css', 'src/components/BookLayout.astro', 'src/markdown/index.ts', 'dist/code-styles.css', 'dist/code-copy.js', 'dist/code-copy-template.html', 'dist/EXPRESSIVE-CODE-LICENSE', 'LICENSE', 'THIRD_PARTY_NOTICES.md']) assert.ok(files.includes(filename), `Missing packed file: ${filename}`);
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
manifest.dependencies['@tcitry/astro-book'] = `file:${path.join(temporary, metadata.filename)}`;
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
const hasDiagram = (html) => /<pre\b[^>]*\bdata-book-mermaid(?:=|\s|>)/.test(html);
const diagramPages = documents.filter(({ html }) => hasDiagram(html));
assert.ok(mathPages.length >= 2, 'Markdown and MDX both need build-time math');
assert.ok(diagramPages.length >= 2, 'Markdown and MDX both need the shared Mermaid contract');
assert.ok(documents.some(({ html }) => !hasDiagram(html)), 'Include a page without diagrams to check conditional runtime loading');
assert.ok(documents.some(({ html }) => /data-book-code/.test(html)), 'Example must contain highlighted code');
for (const { filename, html } of documents) {
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
const summary = { package: metadata.filename, packedFiles: files.length, htmlPages: documents.length, mathPages: mathPages.length, diagramPages: diagramPages.length, fontLinks, searchPages: searchEntry.languages.en.page_count, base, origin, consumer };
await mkdir(path.join(root, '.artifacts'), { recursive: true });
await writeFile(path.join(root, '.artifacts/packed-consumer.json'), JSON.stringify(summary, null, 2) + '\n');
console.log('Packed-package verification passed. Temporary consumer retained for inspection.');
console.log(JSON.stringify(summary, null, 2));
