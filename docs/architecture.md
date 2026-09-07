# Architecture and public API

`packages/astro-book` is a single theme package. `examples/basic` is an independent consumer with synthetic public Markdown and MDX. The consuming blog remains in its own repository and installs a package artifact.

## Boundaries

| Theme | Consuming site |
| --- | --- |
| Layout, navigation, TOC, responsive reading styles | Content scanning, frontmatter interpretation and legacy conversions |
| Search UI, code copying, image zoom, comments display | Search index generation, comments parameters and eligibility |
| Article lists, term lists, tag clouds, cards, timeline, portfolio | Category/tag relationships, sorting, pagination URLs, special-page data |
| Generic SEO output from explicit data | Canonical URLs, site identity, RSS/sitemap/indexing policy |
| Markdown/MDX math, diagrams, code and packaged assets | Framework integrations and interactive islands |

The theme never reads a site's generated content manifest, private content directory, deployment configuration or filesystem conventions. Public models describe display values: labels, links, dates, headings and optional authored HTML. Trust HTML inputs as author-supplied content; these are not an HTML sanitization boundary.

## Integration

`astroBook()` configures a shared processor and adds the MDX integration when it is not already present. Configure it once. Add custom `remarkPlugins`, `rehypePlugins` or `recmaPlugins` under its `markdown` option. The preset deduplicates plugin identities and owns the math/diagram plugins, so Markdown and MDX do not register separate implementations.

`@tcitry/astro-book/markdown` also exports `createBookProcessor()` and `createBookMarkdownRenderer()`. A site with its own importer can first apply source compatibility transformations, then render with the same theme options. The theme does not interpret Hugo shortcodes or legacy URLs.

### Mathematics

KaTeX renders `$inline$` and `$$block$$` formulas during the build. Set `markdown.math.macros` for macros, `singleDollarTextMath: false` when dollar notation is unsuitable, `throwOnError: true` to fail on invalid formulas, or `math: false` to disable rendering. The default error path preserves readable formula source. CSS and fonts are packaged with the theme; long display formulas scroll locally on narrow screens.

This supports KaTeX's mathematics syntax. It does not compile complete LaTeX documents, arbitrary packages or external TeX programs.

### Diagrams and code

Fenced `mermaid` blocks use the same build-time element contract in Markdown and MDX. The client runtime loads Mermaid when those elements exist, uses the reading theme, keeps wide diagrams in a local scroll area and restores readable source on failure. Mermaid configuration can be passed through the integration and overridden by layout configuration. Disable it with `mermaid: false`.

Ordinary code blocks use Shiki, with light/dark palettes and a copy control. Consumer plugins can extend the pipeline; they should not initialize a second math or diagram runtime.

## Components and customization

Public imports use documented subpaths such as `@tcitry/astro-book/components/BookLayout` and `@tcitry/astro-book/components/Timeline`; do not import internal package file paths. Shell types are exported by `@tcitry/astro-book/types`; presentation data is exported by `@tcitry/astro-book/presentation`.

The layout accepts explicit `site`, `page`, `navigation`, `seo`, `search`, `previous` and `next` props. `BookPage` contains a title, URL, optional headings/description/TOC setting and an optional body class. `NavigationItem` uses `id`, `label`, optional `href`, active/expanded state and children. No source filename or content-loader object is required.

Named slots are `head`, `navigation-before`, `navigation`, `navigation-after`, `content-before`, `content-after`, `toc`, `footer`, `comments` and `overlays`, plus the default body slot. Comments remain after footer navigation. A custom shell using only lower-level components must put `data-astro-book` and `data-book-theme="auto"` (or `light`/`dark`) on its `<html>` element and import the public stylesheet. For a prop-compatible replacement, `components.Navigation`, `components.TOC`, `components.Search` and `components.Footer` accept alternatives to the exported defaults. `labels` customizes interface text, `theme` accepts `auto`, `light` or `dark`, and `search: false` disables the default search surface. See the example and exported `BookLayoutProps` for the complete typed contract.

Presentation components accept already-selected data:

- `ArticleMeta`, `PostRow`, `ArticleList` and `GroupedArticleList`: formatted dates, labels, badges, summaries and optional author images.
- `WeeklyCards`, `TagCloud`, `TermList`, `LinkRows` and `Tabs`: card/list data, counts, active states and optional text sizes.
- `Timeline`, `YearSelect` and `Portfolio`: chronological display data. They do not parse content or choose a year.
- `Pagination`: ordered page URLs and the current page number. The site controls URL construction.
- `Badge` and `Notice`: small reusable annotations, with site-selected labels and meanings.

Example of a site-independent timeline:

```astro
---
import Timeline from '@tcitry/astro-book/components/Timeline';
const items = [{ id: 'first', label: '2026', html: '<p>A public example milestone.</p>' }];
---
<Timeline items={items} />
```

## Styles and framework islands

The package supplies compiled CSS. Its build scans package components only, so installing it does not require a Tailwind Vite plugin or access to the consuming site's source. New component styling uses Tailwind CSS v4. Design variables and the public stylesheet entry support site overrides. Public layout variables include `--book-menu-width`, `--book-toc-width`, `--book-content-max-width`, `--book-wide-content-max-width`, `--book-content-without-toc-max-width` and `--book-wide-content-without-toc-max-width`. Reading colors use `--body-background`, `--body-font-color`, `--color-link` and the Book gray palette. Set `page.bodyClass` to `book-page-wide` for the wide listing shape.

```css
/* Load after the package stylesheet in the consuming site. */
:root {
  --book-content-max-width: 66rem;
  --color-link: #086e81;
}
```

Book's legacy compatibility layer retains the established visual layout; its source and scope are documented separately from new utility classes.

CSS is not isolated merely because it is packaged. Reading selectors and reset behavior must be tested alongside embedded widgets. Mark an island boundary with `data-book-island` explicitly and give a widget its own reset/token bridge if its framework needs one. Theme CSS must not force a renderer or global framework reset onto ordinary articles.

Optional React, Svelte, Vue or other islands are consumer concerns. A site can supply custom controls or demos through slots while keeping normal reading pages static. The theme does not provide server-side agent authentication or application backends.
