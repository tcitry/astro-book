---
layout: ../layouts/Article.astro
title: Project structure
description: Understand the theme package, the independent example, and how navigation relates to content.
---

## Two clear boundaries

The repository contains a theme package and a small site that consumes it. The example does not load another blog, shared content folder or external content service.

`Repository`

```text
astro-book/
├── packages/astro-book/       # Public theme and packaged assets
├── examples/basic/
│   ├── astro.config.mjs      # Integration, site URL and base path
│   ├── src/assets/           # Local demonstration image
│   ├── src/data/site.ts      # Chapter order and URL helper
│   ├── src/layouts/Article.astro
│   └── src/pages/
│       ├── index.astro
│       ├── markdown.md
│       ├── mdx.mdx
│       └── …
├── docs/                     # Package development and API guides
└── .github/workflows/        # Package checks and demo deployment
```

## Routes and navigation

Astro creates routes from `src/pages`. A file named `math.md` produces `/math/`; the configured base adds `/astro-book/` when this example runs.

The sidebar is a separate data structure. It can include sections, collapsible groups, icons and external links. This site prepares that structure in `src/data/site.ts`, then supplies it to `BookLayout`.

This separation means you can use content collections, a local importer or another source without changing the navigation component. Your site chooses the ordering and current page.

## One article wrapper

`Article.astro` supplies the site title, chapter navigation, theme selector, search labels and SEO data. It also renders the Markdown headings as a table of contents and prepares previous/next links from the chapter order.

Every Markdown page selects the wrapper in frontmatter:

`Page frontmatter`

```yaml
---
layout: ../layouts/Article.astro
title: My chapter
description: A concise description for readers and search engines.
---
```

MDX uses the same wrapper and Markdown processor. See the [MDX example](../mdx/) for component composition.

## What belongs to your site

- Content loading, publication dates and draft policy.
- URLs, aliases, tags, categories and article ordering.
- Search scope, feeds, sitemaps and deployment.
- Domain identity, analytics and comment configuration.
- Custom applications and framework demos.

The theme supplies presentation components, reading behavior and automatic search indexing of the site's generated HTML. See [components](../components/) for the generic inputs and [customization](../customization/) for layout extension points.
