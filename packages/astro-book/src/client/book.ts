import { initializeCodeCopy } from './code-copy.js';
import type { BookTheme, MermaidClientOptions, SearchConfig } from '../types';

declare global {
  interface Window {
    PagefindUI?: new (options: Record<string, unknown>) => { triggerSearch?: (value: string) => void; destroy?: () => void };
    openSearch?: () => void;
    closeSearch?: () => void;
  }
}
function json<T>(value: string | undefined, fallback: T): T { try { return value ? JSON.parse(value) as T : fallback; } catch { return fallback; } }
let cleanup: (() => void) | undefined;

function initializeBook() {
  cleanup?.();
  if (!document.documentElement.hasAttribute('data-astro-book')) return;
  const controller = new AbortController();
  const { signal } = controller;
  const root = document.documentElement;
  const systemTheme = matchMedia('(prefers-color-scheme: dark)');
  const dark = () => root.dataset.bookTheme === 'dark' || (root.dataset.bookTheme !== 'light' && systemTheme.matches);
  const syncTheme = () => {
    root.classList.toggle('dark', dark());
    document.querySelectorAll<HTMLSelectElement>('[data-book-theme-select]').forEach((select) => { select.value = root.dataset.bookTheme ?? 'auto'; });
    document.querySelectorAll<HTMLButtonElement>('[data-book-theme-set]').forEach((button) => { button.setAttribute('aria-pressed', String(button.dataset.bookThemeSet === root.dataset.bookTheme)); });
    const giscus = document.querySelector<HTMLScriptElement>('script[src="https://giscus.app/client.js"]');
    if (giscus && ['preferred_color_scheme', 'light', 'dark'].includes(giscus.dataset.theme ?? '')) {
      const frame = document.querySelector<HTMLIFrameElement>('iframe.giscus-frame');
      frame?.contentWindow?.postMessage({ giscus: { setConfig: { theme: dark() ? 'dark' : 'light' } } }, 'https://giscus.app');
    }
  };
  const setTheme = (value: string | undefined) => {
    if (value !== 'auto' && value !== 'light' && value !== 'dark') return;
    root.dataset.bookTheme = value;
    try { localStorage.setItem('astro-book-theme', value); } catch {}
  };
  document.querySelectorAll<HTMLElement>('[data-book-theme-set]').forEach((button) => button.addEventListener('click', () => setTheme(button.dataset.bookThemeSet), { signal }));
  document.querySelectorAll<HTMLSelectElement>('[data-book-theme-select]').forEach((select) => select.addEventListener('change', () => setTheme(select.value), { signal }));
  document.addEventListener('astro-book:set-theme', ((event: CustomEvent<BookTheme>) => setTheme(event.detail)) as EventListener, { signal });
  document.addEventListener('load', (event) => {
    if (event.target instanceof HTMLIFrameElement && event.target.classList.contains('giscus-frame')) syncTheme();
  }, { capture: true, signal });

  // Markdown and MDX share the same marker; unprocessed fences also have a safe fallback.
  document.querySelectorAll<HTMLElement>('pre > code.language-mermaid, pre[data-language="mermaid"], pre[data-book-mermaid]').forEach((element) => {
    if (element.closest('[data-book-island], [data-demo], [data-book-mermaid-disabled]')) return;
    const pre = element.tagName === 'PRE' ? element : element.parentElement!;
    pre.classList.add('mermaid'); pre.removeAttribute('style');
  });
  initializeCodeCopy();
  document.querySelectorAll<HTMLTableElement>('.markdown table').forEach((table) => {
    if (table.closest('.table-scroll, .katex, [data-book-island], [data-demo]')) return;
    const wrapper = document.createElement('div'); wrapper.className = 'table-scroll'; table.before(wrapper); wrapper.appendChild(table);
  });

  const menu = document.querySelector<HTMLElement>('.book-menu-content');
  try { if (menu) menu.scrollTop = Number(sessionStorage.getItem('book-menu-scroll') || 0); } catch {}
  window.addEventListener('pagehide', () => { try { if (menu) sessionStorage.setItem('book-menu-scroll', String(menu.scrollTop)); } catch {} }, { signal });
  const scrollTimers = new Map<Element, number>();
  document.addEventListener('scroll', (event) => {
    const area = event.target === document ? document.scrollingElement : event.target;
    if (!(area instanceof Element)) return;
    area.classList.add('is-scrolling'); window.clearTimeout(scrollTimers.get(area));
    scrollTimers.set(area, window.setTimeout(() => { area.classList.remove('is-scrolling'); scrollTimers.delete(area); }, 650));
  }, { capture: true, passive: true, signal });

  const headingLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('.book-toc a[href^="#"], .book-header aside a[href^="#"]'));
  const observed = headingLinks.map((link) => { try { return { link, heading: document.getElementById(decodeURIComponent(link.hash.slice(1))) }; } catch { return { link, heading: null }; } }).filter((item) => item.heading);
  const updateTOC = () => {
    const active = [...observed].sort((a, b) => a.heading!.getBoundingClientRect().top - b.heading!.getBoundingClientRect().top).reverse().find(({ heading }) => heading!.getBoundingClientRect().top <= 100) ?? observed[0];
    for (const { link, heading } of observed) {
      const selected = Boolean(active && heading === active.heading);
      link.closest('li')?.classList.toggle('active', selected);
      if (selected) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
    }
  };
  let frame = 0;
  window.addEventListener('scroll', () => { if (frame) return; frame = requestAnimationFrame(() => { updateTOC(); frame = 0; }); }, { passive: true, signal });
  updateTOC();

  const searchContainer = document.getElementById('search-container');
  const searchDialog = document.getElementById('search-dialog');
  const config = json<SearchConfig>(searchContainer?.dataset.bookSearchConfig, {});
  const basePath = `${config.basePath ?? '/pagefind'}`.replace(/\/$/, '');
  let searchPromise: Promise<void> | undefined;
  let pagefind: { triggerSearch?: (value: string) => void; destroy?: () => void } | undefined;
  let previousFocus: HTMLElement | null = null;
  let bodyOverflow = '';
  const loadScript = (src: string) => new Promise<void>((resolve, reject) => {
    const script = document.createElement('script'); script.src = src;
    script.onload = () => resolve(); script.onerror = () => { script.remove(); reject(new Error(`Unable to load ${src}`)); }; document.head.appendChild(script);
  });
  async function openSearch() {
    if (!searchContainer || !searchDialog) return;
    if (searchContainer.style.display !== 'flex') { previousFocus = document.activeElement as HTMLElement; bodyOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden'; }
    searchContainer.style.display = 'flex'; searchDialog.focus();
    try {
      if (!searchPromise) searchPromise = (async () => {
        if (!document.querySelector('link[data-book-pagefind]')) {
          const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = `${basePath}/pagefind-ui.css`; link.dataset.bookPagefind = ''; document.head.appendChild(link);
        }
        if (!window.PagefindUI) await loadScript(`${basePath}/pagefind-ui.js`);
        if (signal.aborted) return;
        const container = document.getElementById('search'); if (container) container.innerHTML = '';
        if (!window.PagefindUI) throw new Error('PagefindUI unavailable');
        pagefind = new window.PagefindUI({ element: '#search', bundlePath: `${basePath}/`, showSubResults: config.showSubResults ?? true, showImages: config.showImages ?? true, resetStyles: false, autofocus: true, translations: { placeholder: config.placeholder ?? 'Search', ...config.translations } });
      })();
      await searchPromise;
      if (signal.aborted) return;
      const input = document.querySelector<HTMLInputElement>('#search .pagefind-ui__search-input');
      const query = document.querySelector<HTMLInputElement>('#book-search-input')?.value;
      if (query) pagefind?.triggerSearch?.(query);
      if (searchContainer.style.display === 'flex') input?.focus();
    } catch {
      searchPromise = undefined;
      const container = document.getElementById('search');
      if (container) container.textContent = config.errorMessage ?? 'The search index could not be loaded. Close and retry. Generate the Pagefind index with a full build first.';
    }
  }
  function closeSearch() {
    if (!searchContainer || searchContainer.style.display !== 'flex') return;
    searchContainer.style.display = 'none'; document.body.style.overflow = bodyOverflow; previousFocus?.focus({ preventScroll: true });
  }
  window.openSearch = () => void openSearch(); window.closeSearch = closeSearch;
  document.querySelectorAll('[data-open-search]').forEach((trigger) => trigger.addEventListener('click', () => void openSearch(), { signal }));
  document.querySelector<HTMLInputElement>('#book-search-input')?.addEventListener('input', () => void openSearch(), { signal });
  document.querySelector('[data-close-search]')?.addEventListener('click', closeSearch, { signal });
  searchContainer?.addEventListener('click', (event) => { if (event.target === searchContainer) closeSearch(); }, { signal });
  document.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k' && searchContainer) { event.preventDefault(); void openSearch(); return; }
    if (event.key === 'Escape') { closeSearch(); for (const id of ['menu-control', 'toc-control']) { const input = document.getElementById(id) as HTMLInputElement | null; if (input) input.checked = false; } return; }
    const searching = searchContainer?.style.display === 'flex';
    if (searching && event.key === 'Tab' && searchDialog) {
      const controls = Array.from(searchDialog.querySelectorAll<HTMLElement>('a[href], button, input, [tabindex="0"]')).filter((control) => control.offsetParent !== null);
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === searchDialog)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    if (searching || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || (event.target instanceof Element && event.target.closest('input, textarea, select, button, [contenteditable], [data-book-island], [data-demo]'))) return;
    if ((event.key === '/' || event.key === 's') && searchContainer) { event.preventDefault(); void openSearch(); return; }
    const selector = event.code === 'ArrowLeft' ? '.nav.nav-left' : event.code === 'ArrowRight' ? '.nav.nav-right' : null;
    if (selector) { const link = document.querySelector<HTMLAnchorElement>(selector); if (link) location.href = link.href; }
  }, { signal });

  if (document.querySelector('.markdown img[alt]:not([alt=""]):not([data-image-zoom-disabled])')) {
    void import('./image-zoom').then(({ initializeImageZoom }) => { if (!signal.aborted) initializeImageZoom(document, signal); }).catch(() => {});
  }

  const options = json<MermaidClientOptions | false>(document.body.dataset.bookMermaidOptions, {});
  const diagrams = Array.from(document.querySelectorAll<HTMLElement>('pre.mermaid')).filter((diagram) => !diagram.closest('[data-book-island], [data-demo], [data-book-mermaid-disabled]'));
  const sources = new Map(diagrams.map((diagram) => {
    const source = diagram.dataset.bookMermaidSource ?? diagram.textContent ?? '';
    diagram.dataset.bookMermaidSource = source;
    return [diagram, source];
  }));
  let diagramQueue = Promise.resolve();
  let renderSequence = 0;
  const renderDiagrams = () => {
    if (!diagrams.length || options === false) return;
    diagramQueue = diagramQueue.then(async () => {
      const { default: mermaid } = await import('mermaid');
      for (const diagram of diagrams) {
        if (signal.aborted) return;
        const settings = { ...json<MermaidClientOptions>(diagram.dataset.bookMermaidConfig, {}), ...options };
        const { darkTheme = 'dark', errorMessage = 'Diagram could not be rendered. Mermaid source is shown below.', ...configuration } = settings;
        mermaid.initialize({ ...configuration, startOnLoad: false, securityLevel: 'strict', theme: (dark() ? darkTheme : settings.theme ?? 'default') as 'dark' | 'default' });
        const source = sources.get(diagram)!;
        const id = `astro-book-mermaid-${renderSequence++}`;
        const previousError = diagram.nextElementSibling;
        if (previousError?.hasAttribute('data-book-mermaid-error')) previousError.remove();
        try {
          const rendered = await mermaid.render(id, source);
          if (signal.aborted) return;
          diagram.innerHTML = rendered.svg;
          diagram.dataset.processed = 'true';
          const svg = diagram.querySelector('svg'); const viewBox = svg?.viewBox.baseVal;
          if (svg && viewBox && viewBox.width > 0 && viewBox.height > 0) { svg.setAttribute('width', String(viewBox.width)); svg.setAttribute('height', String(viewBox.height)); svg.style.maxWidth = 'none'; }
          rendered.bindFunctions?.(diagram);
        } catch {
          document.getElementById(`d${id}`)?.remove();
          diagram.textContent = source; diagram.removeAttribute('data-processed');
          const message = document.createElement('p'); message.className = 'secondary-info'; message.dataset.bookMermaidError = ''; message.setAttribute('role', 'status'); message.textContent = String(errorMessage); diagram.after(message);
        }
      }
    }).catch(() => { /* Source remains visible if the optional runtime cannot load. */ });
  };
  const themeChanged = () => { syncTheme(); renderDiagrams(); };
  const themeObserver = new MutationObserver(themeChanged);
  themeObserver.observe(root, { attributes: true, attributeFilter: ['data-book-theme'] });
  systemTheme.addEventListener('change', themeChanged, { signal });
  syncTheme(); renderDiagrams();
  cleanup = () => {
    controller.abort(); themeObserver.disconnect(); cancelAnimationFrame(frame);
    for (const timer of scrollTimers.values()) clearTimeout(timer);
    closeSearch(); pagefind?.destroy?.();
  };
}
initializeBook();
document.addEventListener('astro:page-load', initializeBook);
