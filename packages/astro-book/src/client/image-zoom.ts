/** Optional, dependency-free image viewing. Uses a native modal for focus containment. */
export function initializeImageZoom(root: ParentNode = document, signal?: AbortSignal) {
  const images = Array.from(root.querySelectorAll<HTMLImageElement>('.markdown img[alt]:not([alt=""]):not([data-image-zoom-disabled])'))
    .filter((image) => !image.closest('a, [data-book-island], [data-demo]'));
  if (!images.length) return;
  let dialog: HTMLDialogElement | undefined;
  let active: HTMLImageElement | undefined;
  const close = () => { dialog?.close(); dialog?.remove(); dialog = undefined; active?.focus({ preventScroll: true }); active = undefined; };
  function open(image: HTMLImageElement) {
    if (dialog) close();
    active = image;
    dialog = document.createElement('dialog');
    dialog.className = 'book-image-zoom fixed inset-0 m-auto h-[100dvh] w-screen max-w-none cursor-zoom-out border-0 bg-[var(--body-background)] p-5 text-[var(--body-font-color)] backdrop:bg-[var(--body-background)]';
    dialog.setAttribute('aria-label', image.alt);
    const surface = document.createElement('div');
    surface.className = 'flex h-full w-full items-center justify-center';
    const large = document.createElement('img');
    large.src = image.currentSrc || image.src;
    large.alt = image.alt;
    large.className = 'h-auto max-h-full w-auto max-w-full object-contain';
    surface.appendChild(large);
    const button = document.createElement('button');
    button.type = 'button'; button.textContent = '×'; button.setAttribute('aria-label', 'Close image');
    button.className = 'absolute top-3 right-3 cursor-pointer rounded border-0 bg-[var(--body-background)] px-3 py-1 text-3xl text-inherit';
    dialog.append(surface, button);
    document.body.appendChild(dialog);
    dialog.addEventListener('click', close, { signal });
    dialog.addEventListener('cancel', (event) => { event.preventDefault(); close(); }, { signal });
    dialog.showModal();
  }
  for (const image of images) {
    image.classList.add('cursor-zoom-in');
    image.tabIndex = 0;
    image.addEventListener('click', () => open(image), { signal });
    image.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(image); } }, { signal });
  }
  signal?.addEventListener('abort', close, { once: true });
}
