# Public basic example

Run `npm install`, `npm run dev`, or `npm run build` from the repository root. This example uses only public packages and synthetic content. It has no client framework dependency and does not access any external content directory.

- `/` exercises the layout, site navigation and public slots.
- `/markdown/` exercises inline/display math, a configured macro, a long formula, valid/invalid Mermaid, code copying, a wide table, native HTML and a local `srcdoc` iframe.
- `/mdx/` exercises the same math/diagram/code pipeline and an imported Astro component.

`astroBook()` installs the shared Markdown processor and adds MDX support when it is absent. An existing `mdx()` integration inherits the shared processor by default. Do not set `mdx({ extendMarkdownConfig: false })` or a separate MDX processor if you want parity. Consumer remark/rehype plugins belong in `astroBook({ markdown: { remarkPlugins, rehypePlugins } })`; repeated instances of the same plugin function are deduplicated. Import plugin functions rather than passing string package names; Astro MDX does not execute string-named plugins, so this preset rejects them to prevent inconsistent output.

KaTeX renders during the build. Configure macros with `markdown.math.macros`; `markdown.math.throwOnError: true` turns invalid formulas into build errors. The default keeps readable error source. `$...$` and `$$...$$` are supported; this is KaTeX math rendering, not complete LaTeX document compilation. KaTeX styles and fonts belong to the theme's published stylesheet and assets.

Mermaid fences are preserved as escaped text and marked for the theme runtime. The runtime is loaded only on pages containing diagrams. The example deliberately includes one invalid diagram in each format so source fallback is testable. The integration's `mermaid` option is serialized as plain JSON on the diagram; layout-level options can override it.

The package's published styles are complete. This example does not need to scan theme source or install Tailwind to make theme components display correctly. A site that writes its own Tailwind utility classes should configure its own Tailwind pipeline.
