---
layout: ../layouts/Article.astro
title: Typography
description: Headings, paragraphs, emphasis, quotations, lists and native HTML in the reading layout.
---

## A comfortable reading page

Good documentation gives each idea enough room. A paragraph can introduce a concept, a list can collect related choices, and a heading can make the page easy to revisit. The sidebar keeps the larger document in view while the outline follows the current chapter.

Use **strong emphasis** for a key term, *italics* for a title or subtle emphasis, and `inline code` for a short identifier. Links should explain their destination: [explore Markdown features](../markdown/).

### A third-level heading

This heading appears beneath its parent in the table of contents. The same hierarchy works on the mobile outline.

#### A fourth-level heading

Keep the hierarchy meaningful. Heading depth describes the relationship between sections rather than how large a line of text should look.

## Quotations

> A useful note records both an observation and enough context to understand it later.
>
> This is original sample text for the documentation theme.

## Lists

An unordered list presents related items:

- Notes that explain a decision.
- Guides that walk through a procedure.
- References that make a detail easy to find.
  - Small examples help when a type or option is unfamiliar.
  - Related links connect the detail to a larger idea.

An ordered list describes a sequence:

1. Start with a question.
2. Write down the smallest useful example.
3. Verify the behavior and record the result.

## Small typographic details

Press <kbd>Esc</kbd> to dismiss the search dialog. A footnote can hold a supporting detail without interrupting the sentence.[^note]

A definition can use trusted native HTML:

<dl>
  <dt>Static rendering</dt>
  <dd>Producing HTML before a visitor requests a page.</dd>
  <dt>Progressive enhancement</dt>
  <dd>Adding behavior to a document that already has readable content.</dd>
</dl>

---

The rule above separates two parts of a document. Use it sparingly; headings usually communicate the structure more precisely.

[^note]: Footnotes are part of the shared Markdown pipeline and include a return link.
