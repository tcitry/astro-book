---
layout: ../layouts/Article.astro
title: Mathematics
description: Write inline and display mathematics with build-time KaTeX, macros and readable error fallback.
---

## Inline notation

A short expression belongs inside its sentence: for a real number $x \in \RR$, the quantity $x^2$ is nonnegative. Inline math uses single dollar delimiters.

```latex
For $x \in \RR$, the quantity $x^2$ is nonnegative.
```

This site defines `\RR` as a macro for `\mathbb{R}`. The formula is rendered into HTML and MathML during the build.

## Display equations

The quadratic formula is a useful display example:

$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}, \qquad a \ne 0.
$$

Use a pair of double dollar delimiters for display math:

```latex
$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$
```

## Matrices and aligned expressions

$$
A = \begin{pmatrix} 1 & 2 \\ 3 & 4 \end{pmatrix},
\qquad \det(A) = 1\cdot4 - 2\cdot3 = -2.
$$

$$
\begin{aligned}
\int_0^1 x^2\,dx
&= \left[\frac{x^3}{3}\right]_0^1 \\
&= \frac{1}{3}.
\end{aligned}
$$

## Long expressions

Wide formulas stay in their own scrolling region on small screens:

$$
f(x_1,x_2,x_3,x_4,x_5,x_6,x_7,x_8)=\sum_{i=1}^{8}x_i^2+\prod_{i=1}^{8}(1+x_i)+\frac{\partial^2 f}{\partial x_1\partial x_2}+\frac{\partial^2 f}{\partial x_3\partial x_4}
$$

## Macros and validation

```js title="astro.config.mjs"
astroBook({
  markdown: {
    math: {
      macros: { '\\RR': '\\mathbb{R}' },
      throwOnError: false,
    },
  },
});
```

The default keeps invalid math readable. This deliberately unknown command demonstrates that fallback: $\unknowncommand{x}$.

Use `throwOnError: true` when an invalid expression should fail the build. The theme uses [KaTeX](https://katex.org/docs/supported.html) math syntax; it does not compile complete LaTeX documents.
