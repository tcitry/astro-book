import { defineConfig } from 'astro/config';
import astroBook from 'astro-book';

export default defineConfig({
  site: process.env.ASTRO_BOOK_DEMO_SITE ?? 'https://tcitry.github.io',
  base: process.env.ASTRO_BOOK_DEMO_BASE ?? '/astro-book',
  output: 'static',
  trailingSlash: 'always',
  integrations: [astroBook({
    markdown: {
      math: { macros: { '\\RR': '\\mathbb{R}' } },
      shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' } },
    },
    mermaid: { flowchart: { useMaxWidth: false } },
  })],
});
