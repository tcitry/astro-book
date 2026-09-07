import { defineConfig } from 'astro/config';
import astroBook from '@tcitry/astro-book';

export default defineConfig({
  site: 'https://example.org',
  output: 'static',
  trailingSlash: 'always',
  integrations: [astroBook({
    markdown: { math: { macros: { '\\RR': '\\mathbb{R}' } } },
    mermaid: { flowchart: { useMaxWidth: false } },
  })],
});
