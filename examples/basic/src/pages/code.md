---
layout: ../layouts/Article.astro
title: Code blocks
description: Explore static syntax highlighting, file titles, line and text markers, terminal frames and source copying.
---

## Static syntax highlighting

Expressive Code renders fenced code during the build. Its Shiki colors follow the reading theme; a normal article does not load a browser syntax highlighter.

```ts frame="code" title="greeting.ts" {2}
export function greet(name: string) {
  return `Hello, ${name}!`;
}
console.log(greet('reader'));
```

The fence above uses `ts frame="code" title="greeting.ts" {2}`. The explicit `frame="code"` enables the filename header; `title` labels the example and `{2}` highlights its second line. The theme’s quiet default is `frame="none"`, so a title alone does not enable a header. Copying still returns the source code alone.

## Highlight a change

Use line markers to point out an addition, removal or important statement:

```js frame="code" title="cache.js" del={1} ins={2} {3}
const ttl = 30;
const ttl = 60;
const cache = new Map();
```

Mark a specific word when a full line is too broad:

```js frame="code" title="request.js" "signal"
const controller = new AbortController();
fetch('/api/example', { signal: controller.signal });
```

These are presentation annotations. They do not execute the example or rewrite the copied source.

## Terminal sessions

```sh frame="terminal" title="Build the docs"
# Run from the repository root.
npm ci
npm run build
```

This fence uses `sh frame="terminal" title="Build the docs"`. Comments are retained in both the display and copy value. The theme disables automatic filename extraction from comments and terminal comment removal, so an author's code remains intact.

## Plain text and whitespace

A language is optional when highlighting would not help:

```text frame="code" title="A small outline"
Chapter one
  A first observation
  A second observation

Chapter two
  A related question
```

The copy control preserves code text, indentation and line breaks. It uses Expressive Code's upstream clipboard behavior and success feedback.

## Configure the defaults

```js title="astro.config.mjs"
astroBook({
  markdown: {
    code: {
      defaultProps: { frame: 'none' },
      styleOverrides: { codeFontSize: '0.875rem' },
    },
  },
});
```

The default is a quiet frame with a copy button. Add a filename or terminal title on an individual fence when it gives the reader useful context. See the [Expressive Code documentation](https://expressive-code.com/key-features/frames/) for the supported frame syntax.

## Let a consuming site own code presentation

A site that already has its own code UI can opt out of ordinary Expressive Code frames. Set `markdown: { code: false }` in `astroBook()` and pass `code={false}` to `BookLayout`. The first option preserves static highlighting without article frames; the second keeps the raw-HTML enhancement from wrapping those blocks later.

Mermaid retains its diagram-source copy control. This documentation example keeps the default open-source Expressive Code presentation enabled.

## Diagrams are still source code

[Mermaid diagrams](../mermaid/) keep the original diagram source in their copy control after the browser renders the SVG. This makes the example useful both as a picture and as a starting point for another document.
