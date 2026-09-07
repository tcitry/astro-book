---
layout: ../layouts/Article.astro
title: Code blocks
description: Explore native Astro and Shiki syntax highlighting, readable source and lightweight code copying.
---

## Static syntax highlighting

Astro highlights fenced code with Shiki during the build. The theme adds a small copy control in the browser; ordinary articles need no framework or browser syntax highlighter. This example configures light and dark Shiki themes to follow the reading theme.

`greeting.ts`

```ts
export function greet(name: string) {
  return `Hello, ${name}!`;
}
console.log(greet('reader'));
```

Use a language identifier such as `ts` on the opening fence. Put a filename or explanation in the surrounding prose when readers need it. Copying returns the displayed source without the label or syntax-highlighting markup.

## Small examples

Describe the relevant change beside the code:

```js
const ttl = 60;
const cache = new Map();
```

This example sets the cache lifetime to 60 seconds. For a request that can be cancelled, pass an abort signal:

```js
const controller = new AbortController();
fetch('/api/example', { signal: controller.signal });
```

The default renderer does not interpret Expressive Code metadata such as `frame`, `title`, `{2}`, `ins` or `del`. When upgrading older content, move useful labels into prose and remove unsupported annotations. A consuming site can configure its own Shiki transformers when it needs additional highlighting.

## Shell commands

Run from the repository root:

```sh
# Install the locked dependencies and build the docs.
npm ci
npm run build
```

Comments remain part of the displayed and copied source. The theme does not turn them into filenames or remove them from shell examples.

## Plain text and whitespace

Use `text` when syntax highlighting would not help:

```text
Chapter one
  A first observation
  A second observation

Chapter two
  A related question
```

Copying preserves the text shown in the block, including indentation, comments and interior blank lines. Astro's native highlighter omits the final newline before the closing fence. The copy control reports success or a readable failure and leaves the code selectable.

## Configure highlighting

`astro.config.mjs`

```js
astroBook({
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      wrap: false,
    },
  },
});
```

These are Astro's native Shiki options. Set `wrap: true` to wrap long code lines, or keep horizontal scrolling with `wrap: false`. Existing Shiki transformers and language configuration are passed to Astro. Astro's `markdown.syntaxHighlight: false` disables coloring; its `syntaxHighlight.excludeLangs` option can exclude selected languages.

## Let a consuming site own code presentation

Set `markdown: { code: false }` in `astroBook()` to disable the theme's ordinary code-copy enhancement while retaining static highlighting. Also pass `code={false}` to `BookLayout` to cover raw HTML blocks supplied directly by Astro pages. A custom renderer can use its own components and styles behind these boundaries.

Mermaid keeps its source-copy control with either setting. The default theme requires no commercial component package or account.

## Diagrams are still source code

[Mermaid diagrams](../mermaid/) retain their original diagram source for copying after the browser renders the SVG. This makes an example useful both as a picture and as a starting point for another document.
