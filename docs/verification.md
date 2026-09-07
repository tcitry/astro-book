# Local verification

Verified on 2026-09-07 with Node 24.16.0. No npm release or cloud deployment was performed.

- Independent workspace install/build/check passed. Full source checks cover the integration, public types, components and browser runtime; the theme and basic example both report zero errors, warnings and hints.
- 27 focused tests passed: Markdown/MDX math, macros/errors, shared Mermaid contract, code/tables, plugin deduplication, manual/system color schemes and stylesheet BOM regression.
- Before the CSS Modules migration, the packed artifact was installed from a tarball into an independent temporary consumer with public registry configuration and no authentication tokens. All 13 documentation pages built; 3 math and 3 diagram pages were identified. The Pagefind index contains all 13 pages. The package included 127 files; 59 local font references resolved. The consumer had no Tailwind compiler and no frontend framework islands. Reproduce with `npm run verify:package`; its local report is ignored by Git.
- The earlier four-page browser baseline covered Markdown and MDX, code-copy success state, one valid diagram plus two independent source-preserving errors, repeated light/dark rendering, image viewing/Escape/focus restoration, mobile navigation and TOC. At 390px, long math, tables and diagrams scrolled inside the reading column.
- A separate real blog consumed the tarball and retained existing route/comment/navigation/list contracts. Its React and Svelte islands, component resources, search, code copy and comments were exercised separately from this repository.

The Mermaid chunk triggers Vite's size notice. Source and generated HTML confirm a dynamic import and no diagram preload on plain pages; live network transfer and Lighthouse scores were not measured. The copy button's success state was checked; system clipboard bytes were not independently inspected.


## Expressive Code replacement

The shared Markdown/MDX and programmatic renderer now use Expressive Code 0.44.2. Its generated CSS (18.7 KB) and official clipboard module (2.6 KB, both uncompressed) are packaged shared resources. The old custom clipboard behavior, inline SVG and copy-button Sass have been removed. A small DOM adapter places raw HTML from Astro pages into the upstream frame; it skips framework islands.

Additional rendering tests cover Astro’s normalized defaults (including its built-in math exclusion) with filename/terminal headers and line markers in both Markdown and MDX. They also verify complete copy values (tabs, outer blank lines, trailing spaces and terminal comments), visible filename comments, Mermaid source after wrapping, raw HTML/MDX island boundaries and existing custom Shiki transformer output. The true tarball consumer contains 13 static pages, three math pages and three diagram pages, with no React hydration or commercial installation. The prior browser baseline above predates this replacement; its new clipboard interaction is checked separately in the consuming blog before release.


## Independent documentation demo

The expanded `examples/basic` has 13 generic English chapters: overview, getting started, project structure, typography, Markdown, MDX, code, mathematics, Mermaid, components, configuration, customization and deployment. It uses only the theme, Astro and Pagefind; no consumer content or frontend framework is loaded.

Build and source checks pass (27 theme files and 6 Astro/TypeScript example files; Markdown pages are verified by the build). The actual tarball consumer verifies every emitted internal page/asset URL and font against `/astro-book/`, checks the canonical origin `https://tcitry.github.io`, and requires all 13 articles in the static search index. The local production preview returns HTTP 200 at `http://127.0.0.1:4322/astro-book/`.

The GitHub Pages workflow uploads only `examples/basic/dist`. Publication remains pending while Pages reports an inherited account custom domain: the workflow records this condition and skips deployment until the native origin matches. Fresh in-app-browser checks of the expanded preview passed: searching `quadratic` returned three results with `/astro-book/` URLs; the 390px menu opened and navigated; flowchart, sequence and state SVGs rendered, and copying the first diagram returned its flowchart source. The code page showed five captions, 26 Expressive Code lines, its highlighted second line and no fallback `astro-code` blocks. At 390px that page had no whole-page horizontal overflow. Theme switching and code-copy feedback also passed, and no console errors were observed during those checks. These are focused interaction checks, not a Lighthouse or exhaustive performance audit.


## Tailwind v4 and CSS Modules migration

The normal theme build now compiles only package-owned Tailwind utilities, public CSS tokens, the scoped browser baseline and the official third-party assets. Astro bundles the four imported CSS Modules. All retired SCSS sources and the Sass development dependency are removed; the packed-package check rejects SCSS or `styles/compat/` files. Hugo Book attribution is retained alongside the icons, and [the upstream record](upstream.md) distinguishes the original visual baseline from the current upstream CSS implementation.

Build and checks pass (27 theme source files and 6 example files, zero errors/warnings/hints), as do all 27 tests. A clean packed consumer without Tailwind or Sass builds 13 pages and indexes all 13; the package has 119 files and all 59 font references resolve. The check exercises the public component imports, generated module class names and complete precompiled utility stylesheet.

Focused browser checks after the migration confirm the 1920px three-column example with a 1120px reading column, the preserved viewport-margin sidebar clamp, a 390px layout without whole-page horizontal overflow, working navigation/theme switching and Mermaid search results. Code copying returned the complete greeting source; all three diagrams rendered and their source copy worked, while the intentional invalid example kept its readable fallback. The mathematics page rendered its inline and display formulas without page overflow. The real blog consumer and deployment are validated in that project's own records.
