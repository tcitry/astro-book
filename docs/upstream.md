# Hugo Book feature tracking

The visual baseline was ported from Hugo Book `cec082b8dd9b` (2025-10-19). Its MIT attribution is retained in the package. The layout, colors and reading behavior were adapted to Astro; this is not a Hugo template package.

On 2026-09-07 we replaced the inherited SCSS build layer with Tailwind CSS v4 component utilities and CSS Modules. The old files and reference implementation remain recoverable in Git history (last complete compatibility-layer commit: `c9f83e2f8ce43d8d9ab95f64a9b10a8f3dbf9d4f`). Normal development, packaging and consumer builds do not compile Sass.

The latest upstream inspected on 2026-09-07 was [`28cdfe6143dde95f1eaad9d926407cc0a59824dd`](https://github.com/alex-shpak/hugo-book/tree/28cdfe6143dde95f1eaad9d926407cc0a59824dd/assets/styles). It uses ordinary `book.css`, `markdown.css`, `themes.css` and related CSS files. It is newer than our visual baseline and has not been automatically merged. Upstream does not use Tailwind.

For a useful upstream improvement, record the upstream commit, affected reading/navigation/responsive/accessibility behavior, and the corresponding Astro port in the change or pull request. Port only the needed behavior into the theme's components or modules and verify both the standalone example and a real consumer. Templates and styles cannot be merged blindly across these different frameworks. No extra synchronization framework is needed.
