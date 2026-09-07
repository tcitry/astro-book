import { defineConfig } from 'astro/config';
import astroBook from '@tcitry/astro-book';

export default defineConfig({
  site: process.env.ASTRO_BOOK_DEMO_SITE ?? 'https://tcitry.github.io',
  base: process.env.ASTRO_BOOK_DEMO_BASE ?? '/astro-book',
  output: 'static',
  trailingSlash: 'always',
  integrations: [astroBook({
    markdown: { math: { macros: { '\\RR': '\\mathbb{R}' } } },
    mermaid: { flowchart: { useMaxWidth: false } },
  })],
});
