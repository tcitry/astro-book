# Local verification

Verified on 2026-09-07 with Node 24.16.0. No npm release or cloud deployment was performed.

- Independent workspace install/build/check passed. Full source checks cover the integration, public types, components and browser runtime; the theme and basic example both report zero errors, warnings and hints.
- 24 focused tests passed: Markdown/MDX math, macros/errors, shared Mermaid contract, code/tables, plugin deduplication, manual/system color schemes and stylesheet BOM regression.
- The final packed artifact was installed from a tarball into an independent temporary consumer with public registry configuration and no authentication tokens. All 4 pages built; 2 math and 2 diagram pages were identified. The package included 127 files; 59 local font references resolved. The consumer had no Tailwind compiler and no frontend framework islands. Reproduce with `npm run verify:package`; its local report is ignored by Git.
- Browser checks covered Markdown and MDX, code-copy success state, one valid diagram plus two independent source-preserving errors, repeated light/dark rendering, image viewing/Escape/focus restoration, mobile navigation and TOC. At 390px, long math, tables and diagrams scrolled inside the reading column.
- A separate real blog consumed the tarball and retained existing route/comment/navigation/list contracts. Its React and Svelte islands, component resources, search, code copy and comments were exercised separately from this repository.

The Mermaid chunk triggers Vite's size notice. Source and generated HTML confirm a dynamic import and no diagram preload on plain pages; live network transfer and Lighthouse scores were not measured. The copy button's success state was checked; system clipboard bytes were not independently inspected.


## Expressive Code replacement

The shared Markdown/MDX and programmatic renderer now use Expressive Code 0.44.2. Its generated CSS (18.7 KB) and official clipboard module (2.6 KB, both uncompressed) are packaged shared resources. The old custom clipboard behavior, inline SVG and copy-button Sass have been removed. A small DOM adapter places raw HTML from Astro pages into the upstream frame; it skips framework islands.

Additional rendering tests verify complete copy values (tabs, outer blank lines, trailing spaces and terminal comments), visible filename comments, Mermaid source after wrapping, raw HTML/MDX island boundaries and existing custom Shiki transformer output. The true tarball consumer contains four static pages, two math pages and two diagram pages, with no React hydration or commercial installation. The prior browser baseline above predates this replacement; its new clipboard interaction is checked separately in the consuming blog before release.
