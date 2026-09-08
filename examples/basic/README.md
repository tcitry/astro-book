# Public documentation demo

This standalone documentation site demonstrates `@tcitry/astro-book` with generic, public content. It uses public npm packages and Astro components, without React, commercial components, a backend, or an external content directory.

The documentation demo is published at [tcitry.github.io/astro-book/](https://tcitry.github.io/astro-book/). It has no custom domain and is deployed independently from sites that consume the theme.

The example and Pages workflow use `site: 'https://tcitry.github.io'` and `base: '/astro-book/'`, so local navigation also includes `/astro-book/`. The workflow sets these explicitly through `ASTRO_BOOK_DEMO_SITE` and `ASTRO_BOOK_DEMO_BASE`.

## Develop locally

Use Node.js 24 and run these commands from the repository root:

```sh
npm ci
npm run dev
```

The development command builds the theme package before starting the example. Open [http://localhost:4322/astro-book/](http://localhost:4322/astro-book/).

To build the theme and example, generate the search index, and preview the production output:

```sh
npm run build
npm run preview -w @astro-book/basic
```

Open the same local URL. The theme integration automatically generates Pagefind's static index as part of `astro build`; this example neither installs Pagefind directly nor runs a separate indexing command. Search is available after `build` when using `preview` or the deployed site. The development server does not generate that index. The theme resolves search assets beneath Astro's configured base path.

## Deploy to GitHub Pages

In this repository's **Settings → Pages → Build and deployment**, set **Source** to **GitHub Actions** before the first deployment. This is the [GitHub prerequisite for custom Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site#publishing-with-a-custom-github-actions-workflow).

The [Pages workflow](../../.github/workflows/pages.yml) runs on pushes to `main` and can be started from **Actions → Deploy public demo to GitHub Pages → Run workflow**. Select `main` for manual deployment. It installs locked public dependencies, builds the theme and this example, and uploads only `examples/basic/dist`. The separate deploy job publishes through the `github-pages` environment only when `configure-pages` reports the exact origin `https://tcitry.github.io`; it uses GitHub's built-in token, so no custom deployment secret is required.

When Pages reports an inherited custom domain, the build still succeeds and uploads the standard `github-pages` artifact. Download it under the workflow run's **Artifacts** section to obtain the static site bundle. The run summary explains why deployment was skipped. To restore native publishing in that situation, remove the inherited domain binding from the account site and rerun the workflow once Pages reports the required origin. The workflow does not modify that existing production binding.

## Rendering examples

The demo contains 13 chapters, organized into start, writing and customization groups:

- `/astro-book/`: overview and chapter navigation.
- `getting-started/`, `structure/`: installation, local preview and project ownership.
- `typography/`, `code/`, `math/`, `mermaid/`: focused rendering examples with copyable source.
- `components/`: public presentation components with generic fixture data.
- `configuration/`, `customization/`, `deployment/`: public options, slots, search and hosting.

Two combined regression pages also demonstrate the shared pipeline:

- `/astro-book/markdown/` exercises inline/display math, a configured macro, a long formula, valid/invalid Mermaid, code copying, a wide table, native HTML, and a local `srcdoc` iframe.
- `/astro-book/mdx/` exercises the same math/diagram/code pipeline and an imported Astro component.

`astroBook()` installs the shared Markdown processor and adds MDX support when it is absent. An existing `mdx()` integration inherits the shared processor by default. Do not set `mdx({ extendMarkdownConfig: false })` or a separate MDX processor if you want parity. Consumer remark/rehype plugins belong in `astroBook({ markdown: { remarkPlugins, rehypePlugins } })`; repeated instances of the same plugin function are deduplicated. Import plugin functions rather than passing string package names; Astro MDX does not execute string-named plugins, so this preset rejects them to prevent inconsistent output.

KaTeX renders during the build. Configure macros with `markdown.math.macros`; `markdown.math.throwOnError: true` turns invalid formulas into build errors. The default keeps readable error source. `$...$` and `$$...$$` are supported; this is KaTeX math rendering, not complete LaTeX document compilation. KaTeX styles and fonts belong to the theme's published stylesheet and assets.

Mermaid fences are preserved as escaped text and marked for the theme runtime. The runtime is loaded only on pages containing diagrams. The example deliberately includes one invalid diagram in each format so source fallback is testable. The integration's `mermaid` option is serialized as plain JSON on the diagram; layout-level options can override it.

The package's published styles are complete. This example does not need to scan theme source or install Tailwind to make theme components display correctly. A site that writes its own Tailwind utility classes should configure its own Tailwind pipeline.
