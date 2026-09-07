# astro-book

A customizable, static reading theme for Astro, inspired by [Hugo Book](https://github.com/alex-shpak/hugo-book). Build a blog, knowledge base or technical notebook with a familiar three-column layout and room for interactive experiments.

[Getting started](docs/getting-started.md) · [Public API](docs/architecture.md) · [Development and upgrades](docs/development.md)

**Documentation demo — deployment pending:** [tcitry.github.io/astro-book](https://tcitry.github.io/astro-book/). The self-contained [example](examples/basic) covers navigation, Markdown/MDX, code, math, diagrams, components and working search. Its Pages workflow deploys only when GitHub reports this native origin; an inherited user-site domain leaves a downloadable build artifact and an explanation in the workflow summary.

**Site examples:** [yindongliang.com](https://yindongliang.com) · [Astro migration preview](https://preview.yindongliang.com). These consumer sites are maintained separately from the theme documentation.

## Features

- Responsive navigation, table of contents, previous/next links and light/dark/system themes.
- One Markdown and MDX pipeline: build-time KaTeX, lazy Mermaid diagrams with source fallback, Shiki highlighting, code copying and wide-content scrolling.
- Search UI for Pagefind, image zoom, explicit SEO metadata and an optional Giscus component.
- Reusable article metadata, lists, tags, hints and pagination components.
- Typed inputs, named slots and component replacements for customization.
- Tailwind CSS v4 component utilities, scoped CSS Modules and bundled fonts. Utilities ship precompiled and Astro handles the modules; consumers need neither Tailwind nor Sass. The old SCSS build layer is retired.
- Static reading pages require no React renderer, backend, account or private registry. Add framework islands in your own site when needed.

The theme focuses on Hugo Book reading features and framework-neutral customization. Your site controls content loading, URLs, tags/categories, sorting, search indexes, RSS/sitemaps, identity and deployment. Custom weekly, timeline, portfolio, links and demo pages belong to the consuming site, including their UI, data models and styles. No Starlight dependency or prescribed content directory is required.

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
  search={false}
>
  <article class="markdown" data-pagefind-body>
    <h1>Welcome</h1>
    <p>A static reading page, ready for your content.</p>
  </article>
</BookLayout>
```

`BookLayout` loads the packaged CSS and browser features. Search is disabled in this starter until you generate a Pagefind index. Follow the [complete setup guide](docs/getting-started.md) for Markdown/MDX layouts, navigation and TOC, math and diagrams, search, SEO, Giscus, framework islands and customization.

See the [styling contract](docs/architecture.md#styles-and-framework-islands) and [Hugo Book upstream record](docs/upstream.md) for customization and feature ports.

## Develop and verify

```sh
npm run build
npm run check
npm test
npm run verify:package
```

`verify:package` installs a packed artifact into an independent temporary Astro project, then checks its types, build, HTML, CSS, scripts and fonts. That consumer has no Tailwind compiler and cannot scan this repository to complete its styles.

See [architecture and public contracts](docs/architecture.md), [verification notes](docs/verification.md) and [versioning, upgrades and rollback](docs/development.md). Publishing and deployment are separate maintainer actions.

## License

MIT. Adapted Hugo Book code retains Alex Shpak's copyright and pinned-source attribution. See [LICENSE](LICENSE) and [third-party notices](packages/astro-book/THIRD_PARTY_NOTICES.md).
