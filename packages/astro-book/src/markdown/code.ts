import rehypeExpressiveCode, {
  createRenderer, ExpressiveCodeBlock,
  type RehypeExpressiveCodeOptions, type RehypeExpressiveCodeRenderer,
} from 'rehype-expressive-code';
import type { AstroMarkdownOptions, RehypePlugin } from '@astrojs/markdown-remark';

export type BookCodeOptions = Pick<RehypeExpressiveCodeOptions,
  'themes' | 'styleOverrides' | 'defaultProps' | 'defaultLocale' | 'shiki'>;

type Node = {
  type: string; tagName?: string; name?: string; value?: string;
  properties?: Record<string, unknown>; data?: Record<string, unknown>;
  attributes?: { name?: string }[]; children?: Node[];
};
const classNames = (node: Node) => String(Array.isArray(node.properties?.className)
  ? node.properties.className.join(' ') : node.properties?.className ?? '').split(/\s+/);
const sourceText = (node: Node): string => node.value ?? node.children?.map(sourceText).join('') ?? '';
export const isCodeIsland = (node: Node) => ['data-book-island', 'data-demo', 'dataBookIsland', 'dataDemo']
  .some((name) => node.properties?.[name] !== undefined || node.attributes?.some((attribute) => attribute.name === name));

function config(options: BookCodeOptions = {}): RehypeExpressiveCodeOptions {
  return {
    ...options,
    themes: options.themes ?? ['github-light', 'github-dark'],
    themeCssRoot: ':root[data-astro-book]',
    themeCssSelector: (theme) => `[data-book-theme="${theme.type}"]`,
    useDarkModeMediaQuery: true,
    minSyntaxHighlightingColorContrast: 0,
    tabWidth: 0,
    frames: { extractFileNameFromCode: false, removeCommentsWhenCopyingTerminalFrames: false },
    defaultProps: { frame: 'none', ...options.defaultProps },
    styleOverrides: {
      borderRadius: '0.3rem', codeFontSize: '0.875rem', codeLineHeight: '1.5',
      codePaddingBlock: '1rem', codePaddingInline: '1rem', ...options.styleOverrides,
    },
  };
}

let shared: Promise<RehypeExpressiveCodeRenderer> | undefined;
/** Official CSS, frame template and clipboard module are packaged once at build time. */
export const getBookCodeResources = () => shared ??= createRenderer(config());

export function codeOptionsFromShiki(
  options: BookCodeOptions | undefined,
  shiki: AstroMarkdownOptions['shikiConfig'],
  highlight = true,
): BookCodeOptions {
  const { themes, theme, langs, langAlias, transformers } = shiki ?? {};
  const selected = themes ? Object.values(themes) : theme ? [theme] : undefined;
  return {
    ...options,
    themes: options?.themes ?? selected as BookCodeOptions['themes'],
    shiki: !highlight || options?.shiki === false ? false : { langs, langAlias, transformers, ...(typeof options?.shiki === 'object' ? options.shiki : {}) },
  };
}

const find = (node: Node, predicate: (node: Node) => boolean): Node | undefined => {
  if (predicate(node)) return node;
  for (const child of node.children ?? []) { const match = find(child, predicate); if (match) return match; }
};

/** Use the upstream renderer/clipboard, with only Book's content and island boundaries adapted. */
export const rehypeBookCode: RehypePlugin<[BookCodeOptions?]> = (options = {}) => {
  const settings = config(options);
  const transform = rehypeExpressiveCode({
    ...settings,
    customCreateBlock: ({ input }) => {
      // EC normally trims lines and outer blanks. Keep author whitespace; only the
      // Markdown fence's final newline is omitted visually. Copy data stays exact below.
      const block = new ExpressiveCodeBlock({ ...input, code: '' });
      block.insertLines(0, input.code.replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n'));
      return block;
    },
    customCreateRenderer: async () => {
      const [renderer, common] = await Promise.all([createRenderer(settings), getBookCodeResources()]);
      return {
        ...renderer,
        baseStyles: renderer.baseStyles === common.baseStyles ? '' : renderer.baseStyles,
        themeStyles: renderer.themeStyles === common.themeStyles ? '' : renderer.themeStyles,
        // BookLayout supplies one cached official clipboard module, also for raw HTML.
        jsModules: [],
      };
    },
  });
  return async (tree, file) => {
    const targets: { parent: Node; original: Node; normalized: Node; source: string; preserve: boolean }[] = [];
    function collect(parent: Node) {
      if (isCodeIsland(parent) || classNames(parent).includes('expressive-code')) return;
      for (const node of parent.children ?? []) {
        if (isCodeIsland(node)) continue;
        if (node.type === 'element' && node.tagName === 'pre') {
          const code = node.children?.find((child) => child.tagName === 'code');
          const source = sourceText(code ?? node);
          if (!source) continue;
          const normalized: Node = {
            type: 'element', tagName: 'pre', properties: {},
            children: [{ type: 'element', tagName: 'code', properties: { ...code?.properties }, data: code?.data,
              children: [{ type: 'text', value: source }] }],
          };
          targets.push({ parent, original: node, normalized, source,
            preserve: classNames(node).includes('mermaid') || Boolean(code?.children?.some((child) => child.type !== 'text')) });
        } else collect(node);
      }
    }
    collect(tree as Node);
    if (!targets.length) return;
    const selected = { type: 'root' as const, children: targets.map(({ normalized }) => normalized) };
    await transform(selected as Parameters<typeof transform>[0], file);
    targets.forEach(({ parent, original, source, preserve }, index) => {
      const rendered = selected.children[index]!;
      const frame = find(rendered, (node) => node.tagName === 'figure');
      const pre = frame?.children?.find((node) => node.tagName === 'pre');
      if (pre && frame?.children) {
        if (preserve) frame.children[frame.children.indexOf(pre)] = original;
        else pre.properties = { ...pre.properties, ...original.properties,
          className: [...classNames(pre), ...classNames(original)].filter(Boolean) };
      }
      const button = find(rendered, (node) => node.tagName === 'button' && (node.properties?.dataCode !== undefined || node.properties?.['data-code'] !== undefined));
      if (button) button.properties = { ...button.properties, type: 'button',
        'aria-label': button.properties?.title ?? 'Copy code', dataCode: source.replace(/\n/g, '\u007f') };
      parent.children![parent.children!.indexOf(original)] = rendered;
    });
  };
};
