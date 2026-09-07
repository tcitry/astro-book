// Clipboard behavior, icons and feedback are the upstream Expressive Code module.
import '../../dist/code-copy.js';

/** Adapt raw HTML pre elements outside the Markdown pipeline to the package's official frame. */
export function initializeCodeCopy(root = document) {
  const template = document.querySelector('template[data-book-code-frame]');
  if (!(template instanceof HTMLTemplateElement)) return;
  root.querySelectorAll('main pre').forEach((pre) => {
    if (pre.closest('.expressive-code, [data-book-island], [data-demo]')) return;
    const highlighted = pre.closest('.highlight');
    const code = pre.querySelector('code');
    if (highlighted) {
      const candidates = highlighted.querySelectorAll('pre code');
      const content = highlighted.querySelector('code[data-lang]') || candidates[candidates.length - 1];
      if (code !== content) return;
    }
    const frame = template.content.firstElementChild?.cloneNode(true);
    const placeholder = frame?.querySelector('pre');
    const copy = frame?.querySelector('.copy button');
    if (!frame || !placeholder || !copy) return;
    const source = (code ?? pre).textContent || '';
    copy.dataset.code = source.replace(/\n/g, '\u007f');
    copy.type = 'button';
    copy.setAttribute('aria-label', copy.title || 'Copy code');
    pre.before(frame);
    placeholder.replaceWith(pre);
  });
}
