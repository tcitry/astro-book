---
layout: ../layouts/Article.astro
title: Configuration
description: Configure the integration, page layout, static search, SEO and optional comments using the public API.
---

## Integration options

The integration installs one Markdown processor for ordinary Markdown and MDX. It includes math, diagrams and code frames.

```js title="astro.config.mjs"
import { defineConfig } from 'astro/config';
import astroBook from '@tcitry/astro-book';

export default defineConfig({
  site: 'https://example.org',
  base: '/notes',
  output: 'static',
  trailingSlash: 'always',
  integrations: [astroBook({
    markdown: {
      math: { macros: { '\\RR': '\\mathbb{R}' } },
      code: { defaultProps: { frame: 'none' } },
    },
    mermaid: { flowchart: { useMaxWidth: false } },
  })],
});
```

Do not add another Expressive Code integration on top of this one. If your site already uses Astro's MDX integration, leave its shared Markdown configuration enabled.

## Layout inputs

| Input | Purpose |
| --- | --- |
| `site` | Title, homepage, language, optional logo and favicon |
| `page` | Current title, URL, heading list and optional body class |
| `navigation` | Prepared chapter tree and active state |
| `previous`, `next` | Links to adjacent pages selected by your site |
| `seo` | Canonical URL, description, social and structured metadata |
| `search` | Search asset path, labels and result presentation, or `false` |
| `theme` | Initial `auto`, `light` or `dark` appearance |
| `components`, `labels` | Compatible component replacements and interface text |

A normal document supplies its heading list to `page.headings`. Use `page.toc: false` for a page that does not need a table of contents.

## Working static search

This demo runs Pagefind after building the HTML. It uses the theme's search dialog and does not contact a search server.

```sh frame="terminal"
npm install --save-dev pagefind
```

```json title="package.json"
{
  "scripts": {
    "build": "astro build && pagefind --site dist"
  }
}
```

In the wrapper, include only article content in the index:

```astro
<BookLayout search={{ basePath: `${import.meta.env.BASE_URL}pagefind` }} {...layoutProps}>
  <article class="markdown" data-pagefind-body>
    <h1 data-pagefind-meta="title">{title}</h1>
    <slot />
  </article>
</BookLayout>
```

`layoutProps` and `title` above represent the values your wrapper prepares. The navigation and footer are excluded by `BookLayout`. Deploy the entire generated `pagefind` directory with the site. Search is available after **build + preview**, not from a fresh development server.

## Canonical URLs and metadata

Astro's `site` option establishes the origin. Your layout passes the final page URL to the SEO component:

```astro
<BookLayout
  {...layoutProps}
  seo={{
    canonical: new URL(Astro.url.pathname, Astro.site).href,
    description: 'A concise description of this page.',
    type: 'article',
  }}
>
  <slot />
</BookLayout>
```

Your site owns redirects, sitemaps, feeds and the choice of canonical path. The theme does not infer publication policy from your content.

## Optional Giscus comments

The public `Giscus` component can go in the `comments` slot after page navigation. Configure it with your own public repository and Discussion category using the [Giscus configurator](https://giscus.app/).

This documentation demo does not attach itself to another site's Discussions. For an existing comment installation, retain its page mapping while changing the presentation layer.

See the repository's [complete setup guide](https://github.com/tcitry/astro-book/blob/main/docs/getting-started.md) for the typed Giscus example and the rest of the public configuration surface.
