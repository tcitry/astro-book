# astro-book

A customizable, static reading theme for Astro, inspired by [Hugo Book](https://github.com/alex-shpak/hugo-book). Build a blog, knowledge base or technical notebook with a familiar three-column layout and room for interactive experiments.

[Getting started](docs/getting-started.md) · [Public API](docs/architecture.md) · [Development and upgrades](docs/development.md)

**Demo:** [yindongliang.com](https://yindongliang.com). This blog uses astro-book and is maintained separately from the theme documentation.

**Documentation:** [tcitry.github.io/astro-book](https://tcitry.github.io/astro-book/). The self-contained [example](examples/basic) covers navigation, Markdown/MDX, code, math, diagrams, components and working search. Pushes to `main` build and publish the documentation through GitHub Pages. The workflow checks the native origin before deploying; the documentation site has no custom domain.

## Features

- Responsive navigation, table of contents, previous/next links and light/dark/system themes.
- One Markdown and MDX pipeline: build-time KaTeX, lazy Mermaid diagrams with source fallback, native Astro/Shiki highlighting, a small source-copy control and wide-content scrolling.
- Built-in static search: automatic Pagefind indexing after Astro builds, a lazy search dialog and configurable search scope. Image zoom, explicit SEO metadata and an optional Giscus component.
- Reusable article metadata, lists, tags, hints and pagination components.
- Typed inputs, named slots and component replacements for customization.
- Tailwind CSS v4 component utilities, scoped CSS Modules and bundled fonts. Utilities ship precompiled and Astro handles the modules; consumers need neither Tailwind nor Sass. The old SCSS build layer is retired.
- Static reading pages require no React renderer, backend, account or private registry. Add framework islands in your own site when needed.

The theme focuses on Hugo Book reading features and framework-neutral customization. Your site controls content loading, URLs, tags/categories, sorting, search scope, RSS/sitemaps, identity and deployment. Custom weekly, timeline, portfolio, links and demo pages belong to the consuming site, including their UI, data models and styles. No Starlight dependency or prescribed content directory is required.

## Try the example

Use Node.js 22.12 or newer; this repository is verified with Node.js 24.

```sh
git clone https://github.com/tcitry/astro-book.git
cd astro-book
npm ci
npm run dev
```

Open [localhost:4322/astro-book/](http://127.0.0.1:4322/astro-book/). The example covers Markdown, MDX, public components, layout slots and theme switching using synthetic content.

## Use in your Astro site

The package is currently verified as a local tarball; an npm release has not been published. From the theme repository:

```sh
npm ci
npm run pack:theme
```

Copy the generated `tcitry-astro-book-0.1.0.tgz` into your Astro project's root and install it:

```sh
npm install ./tcitry-astro-book-0.1.0.tgz
```

Enable the integration in `astro.config.mjs`:

```js
import { defineConfig } from 'astro/config';
import astroBook from '@tcitry/astro-book';

export default defineConfig({
  site: 'https://example.org',
  output: 'static',
  trailingSlash: 'always',
  integrations: [astroBook()],
});
```

Create `src/pages/index.astro`:

```astro
---
import BookLayout from '@tcitry/astro-book/components/BookLayout';
---
<BookLayout
  site={{ title: 'My notebook', lang: 'en' }}
  page={{ title: 'Welcome', url: '/', toc: false }}
  navigation={[{ id: 'home', label: 'Home', href: '/', active: true }]}
  seo={{ canonical: new URL('/', Astro.site).href }}
>
  <article class="markdown" data-pagefind-body>
    <h1>Welcome</h1>
    <p>A static reading page, ready for your content.</p>
  </article>
</BookLayout>
```

`BookLayout` loads the packaged CSS and browser features. `astroBook()` automatically generates this site's Pagefind index during `astro build`; no separate Pagefind installation or CLI command is needed. Use `astro preview` to test the generated search index. The search asset URL follows Astro's `base` automatically. Follow the [complete setup guide](docs/getting-started.md) for Markdown/MDX layouts, navigation and TOC, math and diagrams, search, SEO, Giscus, framework islands and customization.

See the [styling contract](docs/architecture.md#styles-and-framework-islands) and [Hugo Book upstream record](docs/upstream.md) for customization and feature ports.

## Develop and verify

```sh
npm run build
npm run check
npm test
npm run verify:package
```

`verify:package` installs a packed artifact into an independent temporary Astro project, then checks its types, build, HTML, CSS, scripts, fonts and working search queries beneath the configured base path. That consumer has no Tailwind compiler and cannot scan this repository to complete its styles.

See [architecture and public contracts](docs/architecture.md), [verification notes](docs/verification.md) and [versioning, upgrades and rollback](docs/development.md). Publishing and deployment are separate maintainer actions.

## License

MIT. Adapted Hugo Book code retains Alex Shpak's copyright and pinned-source attribution. See [LICENSE](LICENSE) and [third-party notices](packages/astro-book/THIRD_PARTY_NOTICES.md).
