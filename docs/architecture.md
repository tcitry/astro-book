# Architecture and public API

`packages/astro-book` is a single theme package. `examples/basic` is an independent consumer with synthetic public Markdown and MDX. The consuming blog remains in its own repository and installs a package artifact.

## Boundaries

| Theme | Consuming site |
| --- | --- |
| Layout, navigation, TOC, responsive reading styles | Content scanning, frontmatter interpretation and legacy conversions |
| Search UI and build-time index generation, code copying, image zoom, comments display | Search scope and presentation settings, comments parameters and eligibility |
| Generic article lists, metadata, term lists, tag clouds and pagination | Category/tag relationships, sorting, pagination URLs and custom-page components/data/styles |
| Generic SEO output from explicit data | Canonical URLs, site identity, RSS/sitemap/indexing policy |
| Markdown/MDX math, diagrams, code and packaged assets | Framework integrations and interactive islands |

Weekly, timeline, portfolio, links and demo pages belong entirely to the consuming site. Their reusable appearance alone does not make them theme features: keep their components, display types and dedicated styles beside the site routes. This allows the theme to follow Hugo Book reading features while each site evolves its own React, HeroUI or other implementations.

The theme never reads a site's generated content manifest, private content directory or deployment configuration. Search reads Astro's generated HTML output, without prescribing the source content layout. Public models describe display values: labels, links, dates, headings and optional authored HTML. Trust HTML inputs as author-supplied content; these are not an HTML sanitization boundary.

## Integration

`astroBook()` configures a shared processor and adds the MDX integration when it is not already present. Configure it once. Add custom `remarkPlugins`, `rehypePlugins` or `recmaPlugins` under its `markdown` option. The preset deduplicates plugin identities and owns the math/diagram plugins, so Markdown and MDX do not register separate implementations.

`@tcitry/astro-book/markdown` also exports `createBookProcessor()` and `createBookMarkdownRenderer()`. A site with its own importer can first apply source compatibility transformations, then render with the same theme options. The theme does not interpret Hugo shortcodes or legacy URLs.

### Static search

The integration owns the Pagefind dependency and runs it after Astro emits HTML. Search is enabled by default and indexes `**/*.html` in the build output. Each consuming site publishes its own generated `pagefind` directory; the search implementation is shared, while indexed content remains site-specific. No search service or framework renderer is required.

Keep a site's build command as `astro build`. To limit the generated HTML files that enter the index, configure `astroBook({ search: { glob: '{guides,notes}/**/*.html' } })`. The glob is relative to the generated output directory, not the source content directory. Mark the article with `data-pagefind-body` to select its content; the default shell excludes navigation and footer text. `search.rootSelector` optionally limits parsing to a CSS selector, such as `main`; its default is Pagefind's `html` root. Configure these options in `astroBook()`; the integration does not read `pagefind.yml` or other Pagefind CLI configuration files.

`astroBook({ search: false })` disables index generation. `BookLayout`'s separate `search={false}` prop hides the default search interface on a page. Set both when turning search off entirely; disabling generation alone also allows a site to supply an externally generated Pagefind index. `SearchConfig` controls the interface's labels, translations, images and sub-results. Its default asset path is Astro's `base` followed by `pagefind`; only provide `basePath` when deliberately loading an index from a different location.

A fresh development server has no index. Test search with a complete build followed by `astro preview`, and publish the generated search files with the rest of the site.

### Mathematics

KaTeX renders `$inline$` and `$$block$$` formulas during the build. Set `markdown.math.macros` for macros, `singleDollarTextMath: false` when dollar notation is unsuitable, `throwOnError: true` to fail on invalid formulas, or `math: false` to disable rendering. The default error path preserves readable formula source. CSS and fonts are packaged with the theme; long display formulas scroll locally on narrow screens.

This supports KaTeX's mathematics syntax. It does not compile complete LaTeX documents, arbitrary packages or external TeX programs.

### Diagrams and code

Fenced `mermaid` blocks use the same build-time element contract in Markdown and MDX. The client runtime loads Mermaid when those elements exist, uses the reading theme, keeps wide diagrams in a local scroll area and restores readable source on failure. Mermaid configuration can be passed through the integration and overridden by layout configuration. Disable it with `mermaid: false`.

Ordinary fenced code uses Astro's native build-time Shiki highlighting. Markdown, MDX and programmatic imports share the configured processor, including Shiki themes, transformers, wrapping and language exclusions. `BookLayout` adds small packaged code styles and a copy control; reading pages do not load a framework or browser syntax highlighter.

Copying reads the static `<pre>/<code>` text, preserving visible comments, indentation and blank lines. Astro's native highlighter removes the fence's final newline. Mermaid captures its original source before SVG rendering; raw HTML code remains readable and receives the same copy enhancement. Framework islands marked with `data-book-island` or `data-demo` are excluded.

`markdown.code: false` disables ordinary code enhancement in the processor; `BookLayout`'s `code={false}` also covers raw HTML supplied directly by Astro pages. Use both for a consumer-owned ordinary code UI. Neither disables static syntax highlighting, mathematics or Mermaid source copying. `markdown.shikiConfig` accepts Astro's highlighting options. The previous Expressive Code frame/title/line-marker metadata and object-shaped `markdown.code` configuration are retired; the default renderer supplies no replacement title or terminal UI.

## Components and customization

Public imports use documented subpaths such as `@tcitry/astro-book/components/BookLayout` and `@tcitry/astro-book/components/Notice`; do not import internal package file paths. Shell types are exported by `@tcitry/astro-book/types`; presentation data is exported by `@tcitry/astro-book/presentation`.

The layout accepts explicit `site`, `page`, `navigation`, `seo`, `search`, `previous` and `next` props. `BookPage` contains a title, URL, optional headings/description/TOC setting and an optional body class. `NavigationItem` uses `id`, `label`, optional `href`, active/expanded state and children. No source filename or content-loader object is required.

Named slots are `head`, `navigation-before`, `navigation`, `navigation-after`, `content-before`, `content-after`, `toc`, `footer`, `comments` and `overlays`, plus the default body slot. Comments remain after footer navigation. Customize the shell through `BookLayout` slots and component props to retain its complete resource setup, including packaged reading/code styles and browser enhancements. The public stylesheet and client imports alone do not recreate this coordinated layout setup; do not depend on internal paths for code resources. For a prop-compatible replacement, `components.Navigation`, `components.TOC`, `components.Search` and `components.Footer` accept alternatives to the exported defaults. `labels` customizes interface text, `theme` accepts `auto`, `light` or `dark`, and `search: false` disables the default search surface. See the example and exported `BookLayoutProps` for the complete typed contract.

Presentation components accept already-selected data:

- `ArticleMeta`, `PostRow`, `ArticleList` and `GroupedArticleList`: formatted dates, labels, badges, summaries and optional author images.
- `TagCloud`, `TermList` and `Tabs`: generic term/link data, counts, active states and optional text sizes.
- `GroupedArticleList` remains a generic list of already-grouped articles. It has no weekly, timeline, portfolio or links-page routing, filtering or rendering branches.
- `Pagination`: ordered page URLs and the current page number. The site controls URL construction.
- `Badge` and `Notice`: small reusable annotations, with site-selected labels and meanings.

Example of a framework-neutral reading hint:

```astro
---
import Notice from '@tcitry/astro-book/components/Notice';
---
<Notice variant="info">This content is part of the static article.</Notice>
```

## Styles and framework islands

The package supplies compiled CSS. Its build scans package components only, so installing it does not require a Tailwind Vite plugin or access to the consuming site's source. Component structure and sizing use Tailwind CSS v4 utilities. Astro bundles the imported CSS Modules for selector-based behavior and Markdown descendants. Design variables and the public stylesheet entry support site overrides. Public layout variables include `--book-menu-width`, `--book-toc-width`, `--book-content-max-width`, `--book-wide-content-max-width`, `--book-content-without-toc-max-width` and `--book-wide-content-without-toc-max-width`. Reading colors use `--body-background`, `--body-font-color`, `--color-link` and the Book gray palette. Set `page.bodyClass` to `book-page-wide` for the wide listing shape.

```css
/* Load after the package stylesheet in the consuming site. */
:root {
  --book-content-max-width: 66rem;
  --color-link: #086e81;
}
```

The old Hugo SCSS compatibility layer is retired: no Sass dependency or SCSS build step remains. `tokens.css` holds the public color/width variables; the small, scoped `base.css` normalizes browser defaults without a global preflight. `Shell.module.css` covers responsive controls, viewport-margin clamps, raw TOC slots and printing; `Navigation.module.css` covers tree state; `PostRow.module.css` keeps mobile summaries aligned; `Search.module.css` adapts Pagefind's generated UI; `Reading.module.css` covers Markdown descendants, native Shiki theme colors and supported shortcode presentation. Theme components use utilities for layout, spacing, typography and controls. Responsive rules that override a common utility stay in modules, so a consuming site’s later Tailwind build cannot reset them. KaTeX retains its official styles; `Code.css` supplies the small copy control.

The module reading root has zero specificity and every reading selector excludes `data-book-island` and `data-demo` descendants. The package ships its module sources so Astro can resolve hashed class names; the consumer does not need Tailwind or Sass. Keep public class hooks and CSS variables when replacing a slot, and treat module-generated class names as private. See [upstream tracking](upstream.md) for the preserved Book appearance and future feature ports.

CSS is not isolated merely because it is packaged. Reading selectors and reset behavior must be tested alongside embedded widgets. Mark an island boundary with `data-book-island` explicitly and give a widget its own reset/token bridge if its framework needs one. Theme CSS must not force a renderer or global framework reset onto ordinary articles.

Optional React, Svelte, Vue or other islands are consumer concerns. A site can supply custom controls or demos through slots while keeping normal reading pages static. The theme does not provide server-side agent authentication or application backends.

Book skips its own code-copy, diagram and reading-style enhancements inside `data-book-island` and `data-demo`, including markers placed directly on a `pre`. Markdown fences inside those containers still follow Astro’s native syntax-highlighting configuration; use framework-owned JSX/HTML code elements when the component must own the exact markup.
