import assert from 'node:assert/strict';
import test from 'node:test';
import { mergeConfig } from 'astro/config';
import astroBook from '../src/integration.ts';

function configure({ command = 'dev', options = {}, vite = {} } = {}) {
  const config = {
    integrations: [{ name: '@astrojs/mdx' }],
    markdown: { processor: { name: 'satteri', options: {} }, remarkPlugins: [], rehypePlugins: [] },
    vite,
  };
  const updates = [];
  astroBook(options).hooks['astro:config:setup']({ command, config, updateConfig(update) {
    updates.push(update);
    Object.assign(config, mergeConfig(config, update));
    return config;
  } });
  return { config, updates };
}

test('dev prebundles the theme Mermaid dependency while preserving consumer optimization settings', () => {
  const optimizeDeps = {
    include: ['consumer-cjs'], exclude: ['consumer-esm'], needsInterop: ['consumer-cjs'],
    noDiscovery: true, entries: ['src/pages/index.astro'],
  };
  const { config } = configure({ vite: { optimizeDeps } });
  const expected = {
    ...optimizeDeps, include: ['consumer-cjs', 'astro-book > mermaid'],
  };
  for (const [key, value] of Object.entries(expected)) assert.deepEqual(config.vite.optimizeDeps[key], value);
  assert.deepEqual(optimizeDeps.include, ['consumer-cjs']);
});

test('an existing Mermaid prebundle entry is not duplicated', () => {
  const { config, updates } = configure({ vite: { optimizeDeps: { include: ['astro-book > mermaid'] } } });
  assert.deepEqual(config.vite.optimizeDeps.include, ['astro-book > mermaid']);
  assert.equal(updates.length, 0);
});

test('builds and disabled Mermaid do not add an optional dev dependency', () => {
  for (const input of [{ command: 'build' }, { options: { mermaid: false } }, { options: { markdown: { mermaid: false } } }]) {
    const { config, updates } = configure(input);
    assert.deepEqual(config.vite, {});
    assert.equal(updates.length, 0);
  }
  const { config } = configure({ options: { mermaid: {}, markdown: { mermaid: false } } });
  assert.deepEqual(config.vite.optimizeDeps.include, ['astro-book > mermaid']);
});
