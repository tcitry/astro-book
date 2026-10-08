# @tcitry/astro-book

## 0.1.3

### Patch Changes

- Upgrade KaTeX to 0.18.10 (GHSA fix in 0.18.2: prototype pollution in settings); the packaged stylesheet and fonts now come from KaTeX 0.18.
- `rehype-katex`, `remark-math` and Mermaid still declare KaTeX `^0.16`. Sites must add `"overrides": { "katex": "0.18.10" }` to `package.json`; math rendering now fails the build with that instruction when the rendering KaTeX differs from the packaged stylesheet's version.

## 0.1.2

### Patch Changes

- Clear the leftover hover/focus ring on sidebar expand/collapse controls after a pointer click, while keeping a keyboard focus ring on the visible label.

## 0.1.1

- Publish verified packages from main through GitHub Actions and npm Trusted Publishing, with provenance.
- Recheck registry version availability before publishing and avoid stale cached registry responses.
- Theme runtime behavior is unchanged from 0.1.0.

## 0.1.0

- Initial public npm release of the Astro reading theme.
