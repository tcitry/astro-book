# @tcitry/astro-book

## 0.1.3

### Patch Changes

- Upgrade KaTeX from 0.16.47 to 0.18.10 for [GHSA-238p-pmpm-9mq7](https://github.com/advisories/GHSA-238p-pmpm-9mq7). KaTeX 0.18 prefixes its internal CSS classes, so consumers must add `"overrides": { "katex": "0.18.10" }` to keep `rehype-katex` markup in step with the packaged stylesheet.

## 0.1.2

### Patch Changes

- Clear the leftover hover/focus ring on sidebar expand/collapse controls after a pointer click, while keeping a keyboard focus ring on the visible label.

## 0.1.1

- Publish verified packages from main through GitHub Actions and npm Trusted Publishing, with provenance.
- Recheck registry version availability before publishing and avoid stale cached registry responses.
- Theme runtime behavior is unchanged from 0.1.0.

## 0.1.0

- Initial public npm release of the Astro reading theme.
