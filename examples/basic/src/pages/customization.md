---
layout: ../layouts/Article.astro
title: Customization
description: Adapt the book layout with slots, typed component replacements, width variables and optional framework islands.
---

## Start with the layout

Reuse `BookLayout` and provide your own data. You can change the chapter tree, labels and footer while retaining the responsive layout, code resources, theme switching and other reading behavior.

This documentation site's wrapper adds a theme selector below the navigation, a source link in the footer and its own previous/next sequence.

## Named slots

| Slot | Placement |
| --- | --- |
| `head` | Additional metadata in the document head |
| `navigation-before`, `navigation-after` | Around the chapter navigation |
| `navigation` | Replace the chapter tree |
| `content-before`, `content-after` | Around the main article |
| `toc` | Replace the desktop and mobile heading outline |
| `footer` | Replace the footer, including its default navigation |
| `comments` | After footer navigation |
| `overlays` | Additional page-level UI |

`An announcement slot`

```astro
<BookLayout {...layoutProps}>
  <p slot="content-before" class="book-hint info">
    This chapter describes the current stable API.
  </p>
  <article class="markdown">
    <slot />
  </article>
</BookLayout>
```

A custom `toc` is rendered in both desktop and mobile regions. Keep it static and avoid duplicate-ID controls or hydrated widgets there.

## Replace a component

`components.Navigation`, `components.TOC`, `components.Search` and `components.Footer` accept alternatives with the same props as their exported defaults. Use the types exported by `@tcitry/astro-book/types` to keep the boundary explicit.

A slot works well when you own the markup directly. A component replacement is useful when several layouts share the same alternative implementation.

## Appearance and reading widths

The theme ships complete CSS. This demo needs no Tailwind compiler of its own. If your site writes new utility classes, configure its own Tailwind v4 pipeline; for component-specific rules, CSS Modules are another option.

For the structural reading layout, the published CSS variables provide a narrow customization surface:

`Your site's reading overrides`

```css
:root {
  --book-menu-width: 20rem;
  --book-toc-width: 20rem;
  --book-content-max-width: 70rem;
  --book-wide-content-max-width: 80rem;
}
```

Load your overrides after the theme styles. Change a small set of tokens first, then check the result on narrow and wide screens in both themes.

## Optional framework islands

Ordinary pages need no client framework. A site can add React, Vue or Svelte through its own Astro integration when a demonstration needs one.

`A consumer-owned island`

```astro
---
import InteractiveDemo from '../components/InteractiveDemo';
---
<div data-book-island>
  <InteractiveDemo client:visible />
</div>
```

The component and renderer belong to the consuming project. Keep related state inside one island. The marker keeps reading enhancements out of the widget; inherited styles still deserve an integration check.

## Keep resource setup together

`BookLayout` includes the shared code stylesheet and the fallback frame template as well as the public CSS and client entry. Importing only `styles.css` and `client` is not a complete shell replacement. Use slots and compatible component props to retain the full reading setup.
