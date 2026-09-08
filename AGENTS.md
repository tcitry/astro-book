# astro-book

This is a public, MIT-licensed Astro theme. Everything needed to install, develop, build, test, or package it must work without commercial accounts or private registries. Do not add commercial component packages, their installers, licensed source, tokens, or private blog content anywhere in this repository.

Use framework-neutral Astro components for the reading shell. Client frameworks are optional islands. Public inputs are generic presentation data; Hugo parsing, URL policy, taxonomies, RSS and site identity belong to consumers.

New styling uses Tailwind CSS v4 first, CSS Modules second. The package publishes complete prebuilt CSS and assets. Keep complex descendant, state and print rules in CSS Modules; do not reintroduce the retired Hugo Sass build layer. Test a packed package, not only workspace links.

Use Astro’s built-in Shiki for default build-time code highlighting and respect consumer `syntaxHighlight` / `shikiConfig`. Keep the optional clipboard enhancement small and framework-neutral, preserve Mermaid source copying, and allow consumers to replace ordinary code presentation. Do not restore Expressive Code or rebuild its filename, terminal-frame, or line-marker UI in the theme.

Publish the public npm package as `@tcitry/astro-book`; keep the repository name `astro-book`. Pushes to `main` run the npm publication workflow. Bump the package version and update the lockfile for a release; already published versions must be skipped. Publish only the tarball that passed the independent consumer checks, using npm Trusted Publishing from GitHub Actions. Never commit registry credentials.
