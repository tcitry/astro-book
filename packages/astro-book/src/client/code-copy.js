/** Copy rendered source without introducing a code renderer or a UI framework. */
export function initializeCodeCopy(root = document) {
  root.querySelectorAll('main pre').forEach((pre) => {
    if (pre.closest('[data-book-code-block], [data-book-island], [data-demo]') || pre.hasAttribute('data-book-code-disabled')) return;
    if (document.body.hasAttribute('data-book-code-disabled') && !pre.matches('pre.mermaid, pre[data-book-mermaid]')) return;
    const code = pre.querySelector('code');
    const highlighted = pre.closest('.highlight');
    if (highlighted) {
      const candidates = highlighted.querySelectorAll('pre code');
      const content = highlighted.querySelector('code[data-lang]') || candidates[candidates.length - 1];
      if (code !== content) return;
    }
    // Capture before Mermaid replaces the source with SVG; retain indentation and comments.
    const source = pre.dataset.bookMermaidSource ?? (code ?? pre).textContent ?? '';
    const wrapper = document.createElement('div');
    wrapper.dataset.bookCodeBlock = '';
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.bookCodeCopy = '';
    button.textContent = 'Copy';
    button.setAttribute('aria-label', 'Copy code');
    const status = document.createElement('span');
    status.dataset.bookCodeStatus = '';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    const controls = document.createElement('div');
    controls.dataset.bookCodeUi = '';
    controls.setAttribute('data-pagefind-ignore', '');
    controls.append(status, button);
    pre.before(wrapper);
    wrapper.append(controls, pre);
    button.addEventListener('click', async () => {
      button.disabled = true;
      status.textContent = '';
      try {
        await navigator.clipboard.writeText(source);
        status.textContent = 'Copied';
      } catch {
        status.textContent = 'Copy failed. Select the code to copy it.';
      } finally {
        button.disabled = false;
      }
    });
  });
}
