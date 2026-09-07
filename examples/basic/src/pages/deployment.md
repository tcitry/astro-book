---
layout: ../layouts/Article.astro
title: Deployment
description: Build the independent documentation demo and publish static output to a project path on GitHub Pages.
---

## A static deployment

This example outputs HTML, CSS, scripts, fonts, images and a search index. There is no request-time renderer, API server or backend deployment.

```sh
npm ci
npm run build
npm run check
npm test
```

The theme package is built first. Astro then builds the example, and the theme integration automatically runs Pagefind to index its articles before the build completes. The deployable directory is **`examples/basic/dist`**.

## GitHub Pages

The repository's `pages.yml` workflow builds this example and uploads only its static output. It runs on a push to `main` or a manual workflow dispatch.

The project is configured for the native GitHub Pages address:

`examples/basic/astro.config.mjs`

```js
export default defineConfig({
  site: 'https://tcitry.github.io',
  base: '/astro-book',
  output: 'static',
  trailingSlash: 'always',
});
```

In the repository settings, select **Pages → Build and deployment → GitHub Actions**. The workflow uses GitHub's Pages artifact and deployment actions; no deployment token is stored in the source tree.

The deployment job checks that Pages reports the intended native origin. If the account's existing user site forces an inherited custom domain, the job leaves the artifact available and explains the blocked deployment in its summary. It does not silently publish this documentation under a different site identity.

## Paths beneath a base

Astro rewrites bundled assets for the configured base. Links and files from `public` must also resolve beneath that path. This example centralizes constructed URLs in a helper:

`src/data/site.ts`

```ts
export const withBase = (path = '') =>
  `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
```

Markdown links between sibling pages are relative. The wrapper uses the same base for the homepage and chapter navigation; the theme automatically resolves Pagefind assets beneath Astro's base. Avoid root-relative paths such as `/math/` when the site actually lives at `/astro-book/math/`.

## Check the built site

```sh
npm run preview --workspace @astro-book/basic
```

Open `http://127.0.0.1:4322/astro-book/`, follow chapter links, open search, switch themes and copy a code example. Verify a formula, a diagram and the local image before deploying.

## Other static hosts

The same output can be served by a static host such as Cloudflare Pages. Set your own `site` and `base`, keep the complete search directory and use the equivalent build and output settings. A static Astro site does not need a framework adapter merely to serve these generated files.

The theme does not choose a hosting provider or domain for a consuming site. Keep those settings in the site configuration and deployment workflow.
