---
layout: ../layouts/Article.astro
title: Getting started
description: Run the public example, build a static site, and install the theme in an Astro project.
---

## Run this documentation site

Use Node.js 22.12 or newer. The repository checks run on Node.js 24.

```sh frame="terminal"
git clone https://github.com/tcitry/astro-book.git
cd astro-book
npm ci
npm run dev
```

Open **http://127.0.0.1:4322/astro-book/**. Edit a page under `examples/basic/src/pages` and the development server will update it.

## Preview the complete build

The theme generates a Pagefind index automatically during the Astro build. From the repository root:

```sh frame="terminal"
npm run build
npm run preview --workspace @astro-book/basic
```

The preview uses the same `/astro-book/` path as GitHub Pages. Open search and try **quadratic** to find the mathematics guide.

## Install the theme in your own project

The theme has not yet been published to npm. Create an installable artifact from this repository:

```sh frame="terminal"
npm run pack:theme
```

Copy `tcitry-astro-book-0.1.0.tgz` into your Astro project, then install it:

```sh frame="terminal"
npm install ./tcitry-astro-book-0.1.0.tgz
```

Enable the public integration:

```js title="astro.config.mjs" {8}
import { defineConfig } from 'astro/config';
import astroBook from '@tcitry/astro-book';

export default defineConfig({
  site: 'https://example.org',
  output: 'static',
  trailingSlash: 'always',
  integrations: [astroBook()],
});
```

## Create a page

```astro title="src/pages/index.astro"
---
import BookLayout from '@tcitry/astro-book/components/BookLayout';
---
<BookLayout
  site={{ title: 'Field notes', home: '/', lang: 'en' }}
  page={{ title: 'Welcome', url: '/', toc: false }}
  navigation={[{ id: 'home', label: 'Welcome', href: '/', active: true }]}
>
  <article class="markdown" data-pagefind-body>
    <h1 data-pagefind-meta="title">Welcome</h1>
    <p>A place for careful notes.</p>
  </article>
</BookLayout>
```

Run `astro build` to generate the pages and their search index, then `astro preview` to test search. No separate Pagefind installation or indexing command is needed. Read [configuration](../configuration/) to customize search scope and presentation, and [project structure](../structure/) to understand where each responsibility belongs.
