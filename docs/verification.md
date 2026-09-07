# Local verification

Verified on 2026-09-07 with Node 24.16.0. No npm release or cloud deployment was performed.

- Independent workspace install/build/check passed. Full source checks cover the integration, public types, components and browser runtime; the retained legacy clipboard fallback produces a deprecation hint.
- 16 focused tests passed: Markdown/MDX math, macros/errors, shared Mermaid contract, code/tables, plugin deduplication, manual/system color schemes and stylesheet BOM regression.
- The final packed artifact was installed from a tarball into an independent temporary consumer with public registry configuration and no authentication tokens. All 4 pages built; 2 math and 2 diagram pages were identified. The package included 125 files; 59 local font references resolved. The consumer had no Tailwind compiler and no frontend framework islands. Reproduce with `npm run verify:package`; its local report is ignored by Git.
- Browser checks covered Markdown and MDX, code-copy success state, one valid diagram plus two independent source-preserving errors, repeated light/dark rendering, image viewing/Escape/focus restoration, mobile navigation and TOC. At 390px, long math, tables and diagrams scrolled inside the reading column.
- A separate real blog consumed the tarball and retained existing route/comment/navigation/list contracts. Its React and Svelte islands, component resources, search, code copy and comments were exercised separately from this repository.

The Mermaid chunk triggers Vite's size notice. Source and generated HTML confirm a dynamic import and no diagram preload on plain pages; live network transfer and Lighthouse scores were not measured. The copy button's success state was checked; system clipboard bytes were not independently inspected.
