# @tcitry/astro-book

A static reading theme for Astro, inspired by [Hugo Book](https://github.com/alex-shpak/hugo-book). Build a blog, knowledge base or technical notebook with navigation, a table of contents, Markdown/MDX, math, diagrams and static search.

[Documentation](https://tcitry.github.io/astro-book/) · [Setup guide](https://github.com/tcitry/astro-book/blob/main/docs/getting-started.md) · [API](https://github.com/tcitry/astro-book/blob/main/docs/architecture.md) · [Issues](https://github.com/tcitry/astro-book/issues)

## Install

Requires Node.js 22.12+ and Astro 7.3.1 or a compatible Astro 7 release. In your Astro project:

```sh
npm install @tcitry/astro-book
```

The package includes its styles, icons, fonts, Markdown support and Pagefind. Reading pages need no React renderer, Tailwind compiler, backend or commercial account.

## Configure

Add the integration to `astro.config.mjs`:

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

Use your own production origin for `site`. Create `src/pages/index.astro`:

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
    <h1 data-pagefind-meta="title">Welcome</h1>
    <p>A place for your notes.</p>
  </article>
</BookLayout>
```

Run your site's `npm run dev` to start writing. Run `npm run build` followed by `npm run preview` to test Pagefind search; its index is generated during builds.

## Add your content

The theme provides the reading shell and rendering features. Your site owns content loading, URLs, navigation data, RSS and deployment. Use Astro pages, Content Collections or your own loader. The [setup guide](https://github.com/tcitry/astro-book/blob/main/docs/getting-started.md) includes a reusable Markdown/MDX layout and examples for math, Mermaid, code, SEO, Giscus and optional framework islands.

Customize the layout through typed props, slots and component replacements. Utilities ship precompiled and Astro processes the included CSS Modules. See the [styling contract](https://github.com/tcitry/astro-book/blob/main/docs/architecture.md#styles-and-framework-islands).

## License

MIT. Adapted Hugo Book code retains its original attribution. The package includes `LICENSE` and `THIRD_PARTY_NOTICES.md` with details about bundled assets.
