---
layout: ../layouts/Article.astro
title: Configuration
description: Configure the integration, page layout, static search, SEO and optional comments using the public API.
---

## Integration options

The integration installs one Markdown processor for ordinary Markdown and MDX. It includes math, diagrams, native Astro/Shiki highlighting and a small code-copy enhancement.

`astro.config.mjs`

```js
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
      shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' } },
    },
    mermaid: { flowchart: { useMaxWidth: false } },
  })],
});
```

Astro handles code highlighting; no additional code-rendering integration is needed. If your site already uses Astro's MDX integration, leave its shared Markdown configuration enabled. Set `markdown.code: false` here and `code={false}` on `BookLayout` when a consuming site supplies its own ordinary code UI; Mermaid source copying remains available.

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

The theme owns the Pagefind dependency, search dialog and index generation. `astroBook()` automatically indexes the generated HTML before `astro build` finishes. This demo does not install Pagefind separately, run an additional CLI command or contact a search server.

Keep the ordinary build script:

`package.json`

```json
{
  "scripts": {
    "build": "astro build"
  }
}
```

In the wrapper, include only article content in the index:

```astro
<BookLayout search={{ placeholder: 'Search documentation', showImages: false }} {...layoutProps}>
  <article class="markdown" data-pagefind-body>
    <h1 data-pagefind-meta="title">{title}</h1>
    <slot />
  </article>
</BookLayout>
```

`layoutProps` and `title` above represent the values your wrapper prepares. The navigation and footer are excluded by `BookLayout`. Search assets follow Astro's `base` automatically, including this site's `/astro-book/` path.

All generated HTML is indexed by default. Limit the scope with an output-relative glob when needed:

`astro.config.mjs`

```js
integrations: [astroBook({
  search: { glob: '{guides,notes}/**/*.html' },
})],
```

The optional `search.rootSelector` limits parsing to a matching HTML root, such as `main`; the default is `html`. Keep integration settings in `astro.config.mjs`: the theme does not read Pagefind CLI configuration files such as `pagefind.yml`.

Each site builds an index of its own content using the same theme implementation. Deploy the entire generated `pagefind` directory with the site. Search is available after **build + preview**, not from a fresh development server.

To turn search off entirely, set `astroBook({ search: false })` to skip index generation and `search={false}` on `BookLayout` to hide the interface. These options are independent: a site can supply an externally generated index or hide the interface on selected pages. A custom index location can be supplied with the layout's `search.basePath`; translations and result presentation also belong to the layout settings.

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
