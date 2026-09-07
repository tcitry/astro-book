import {
  unified,
  type AstroMarkdownOptions,
  type MarkdownRenderOptions,
  type RehypePlugin,
  type UnifiedProcessorOptions,
} from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import { rehypeBookCode, codeOptionsFromShiki, isCodeIsland, type BookCodeOptions } from './code.ts';
export type { BookCodeOptions } from './code.ts';

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
export type MermaidOptions = Record<string, JsonValue>;
export type MathOptions = NonNullable<Parameters<typeof rehypeKatex>[0]> & {
  /** Fail the build on invalid math. Otherwise preserve readable source with KaTeX's error markup. */
  throwOnError?: boolean;
  /** Treat `$...$` as inline math. Defaults to true. */
  singleDollarTextMath?: boolean;
};
export interface BookMarkdownOptions extends UnifiedProcessorOptions {
  math?: MathOptions | false;
  mermaid?: MermaidOptions | false;
  shikiConfig?: AstroMarkdownOptions['shikiConfig'];
  /** Static Expressive Code frames. Set false to keep Astro code output for a consumer renderer. */
  code?: BookCodeOptions | false;
}

type TreeNode = {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: TreeNode[];
};
const classes = (node: TreeNode) => Array.isArray(node.properties?.className)
  ? node.properties.className.map(String)
  : String(node.properties?.className ?? '').split(/\s+/).filter(Boolean);
const text = (node: TreeNode): string => node.value ?? (node.children?.map(text).join('') ?? '');

/** One HAST transform works in Markdown and MDX without injecting raw HTML or JSX. */
export const rehypeBookContent: RehypePlugin<[{ mermaid?: MermaidOptions | false }?]> = (options = {}) => {
  return (tree) => {
    function walk(parent: TreeNode) {
      if (!parent.children || isCodeIsland(parent)) return;
      parent.children = parent.children.map((node) => {
        walk(node);
        if (node.type !== 'element') return node;
        if (node.tagName === 'pre') {
          const code = node.children?.find((child) => child.tagName === 'code');
          const isMermaid = code && (classes(code).includes('language-mermaid')
            || node.properties?.['data-language'] === 'mermaid' || node.properties?.dataLanguage === 'mermaid');
          if (isMermaid && options.mermaid === false) {
            node.properties = { ...node.properties, 'data-book-code': '', 'data-book-mermaid-disabled': '' };
          } else if (isMermaid) {
            node.properties = {
              className: ['mermaid'],
              'data-book-mermaid': '',
              ...(options.mermaid && Object.keys(options.mermaid).length
                ? { 'data-book-mermaid-config': JSON.stringify(options.mermaid) }
                : {}),
            };
            // Plain text remains readable before JS, after a render error, and with JS disabled.
            node.children = [{ type: 'element', tagName: 'code', properties: {}, children: [{ type: 'text', value: text(code).replace(/\n$/, '') }] }];
          } else {
            node.properties = { ...node.properties, 'data-book-code': '' };
          }
        }
        if (node.tagName === 'th') node.properties = { ...node.properties, scope: 'col' };
        if ((node.tagName === 'th' || node.tagName === 'td') && node.properties?.align) {
          node.properties.style = `text-align: ${node.properties.align};${node.properties.style ?? ''}`;
          delete node.properties.align;
        }
        if (node.tagName === 'table' && !classes(parent).includes('table-scroll')) {
          return { type: 'element', tagName: 'div', properties: { className: ['table-scroll'], tabIndex: 0 }, children: [node] };
        }
        return node;
      });
    }
    walk(tree);
  };
};

// Astro reparses trusted HTML after user plugins. Parse it before code selection as
// well so raw HTML fences get the same renderer; preserve MDX's explicit JSX nodes.
const rehypeBookRaw: RehypePlugin = () => {
  const parse = rehypeRaw({ passThrough: ['mdxjsEsm', 'mdxFlowExpression', 'mdxTextExpression', 'mdxJsxFlowElement', 'mdxJsxTextElement'] });
  return (tree, file) => {
    const containsRaw = (node: TreeNode): boolean => node.type === 'raw' || Boolean(node.children?.some(containsRaw));
    if (containsRaw(tree)) return parse(tree, file);
  };
};

const rehypeBookMath: RehypePlugin<[MathOptions?]> = (options = {}) => {
  const { throwOnError = false, singleDollarTextMath: _single, ...katexOptions } = options;
  const render = rehypeKatex({ strict: 'ignore', ...katexOptions });
  return (tree, file) => {
    const before = file.messages.length;
    render(tree, file);
    if (throwOnError) {
      const error = file.messages.slice(before).find((message) => message.source === 'rehype-katex');
      if (error) throw error;
    }
  };
};

function pluginKey(entry: unknown) {
  return Array.isArray(entry) ? entry[0] : entry;
}
/** First occurrence wins; theme-owned plugins use their explicit theme options. */
export function uniquePlugins<T>(entries: T[]): T[] {
  const seen = new Set<unknown>();
  return entries.filter((entry) => {
    const key = pluginKey(entry);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
const isManagedMath = (entry: unknown) => {
  const key = pluginKey(entry);
  return key === remarkMath || key === rehypeKatex || key === rehypeBookMath || key === 'remark-math' || key === 'rehype-katex';
};

function sharedOptions(options: BookMarkdownOptions, shared: AstroMarkdownOptions = {}): AstroMarkdownOptions {
  const input = shared.shikiConfig ?? {};
  const custom = options.shikiConfig ?? {};
  const configuredThemes = custom.themes ?? input.themes;
  const explicitTheme = custom.theme ?? (input.theme !== 'github-dark' ? input.theme : undefined);
  const shikiConfig = { ...input, ...custom };
  if (Object.keys(configuredThemes ?? {}).length) {
    shikiConfig.themes = configuredThemes;
    delete shikiConfig.theme;
  } else if (explicitTheme) {
    shikiConfig.theme = explicitTheme;
    delete shikiConfig.themes;
  } else {
    // Astro supplies github-dark by default; Book follows the reading theme.
    shikiConfig.themes = { light: 'github-light', dark: 'github-dark' };
    delete shikiConfig.theme;
  }
  const syntax = shared.syntaxHighlight;
  return {
    ...shared,
    shikiConfig,
    syntaxHighlight: syntax === false ? false : {
      type: typeof syntax === 'string' ? syntax : syntax?.type ?? 'shiki',
      excludeLangs: [...new Set([...(typeof syntax === 'object' ? syntax.excludeLangs ?? [] : []), ...(options.mermaid === false ? [] : ['mermaid'])])],
    },
  };
}

/** Set `markdown.processor` to this preset, or let the `astroBook()` integration configure it. */
export function createBookProcessor(options: BookMarkdownOptions = {}) {
  const { math = {}, mermaid = {}, shikiConfig: _shiki, code, ...extra } = options;
  if ([...(extra.remarkPlugins ?? []), ...(extra.rehypePlugins ?? [])].some((plugin) => typeof pluginKey(plugin) === 'string')) {
    throw new TypeError('Import plugin functions instead of string names so Markdown and MDX run the same plugins.');
  }
  const processor = unified({
    ...extra,
    gfm: extra.gfm ?? true,
    remarkPlugins: uniquePlugins([
      ...(math === false ? [] : [[remarkMath, { singleDollarTextMath: math.singleDollarTextMath ?? true }] as [typeof remarkMath, object]]),
      ...(extra.remarkPlugins ?? []).filter((plugin) => !isManagedMath(plugin)),
    ]),
    rehypePlugins: uniquePlugins([
      rehypeBookRaw,
      ...(math === false ? [] : [[rehypeBookMath, math] as [typeof rehypeBookMath, MathOptions]]),
      [rehypeBookContent, { mermaid }],
      ...(extra.rehypePlugins ?? []).filter((plugin) => !isManagedMath(plugin) && ![rehypeBookContent, rehypeBookCode, rehypeBookRaw].includes(pluginKey(plugin) as typeof rehypeBookContent)),
      ...(code === false ? [] : [[rehypeBookCode, code] as [typeof rehypeBookCode, BookCodeOptions | undefined]]),
    ]),
  });
  // Keep the original renderer factory before installing the configured wrappers.
  const processorBase = unified(processor.options);
  function configured(shared: AstroMarkdownOptions) {
    const resolved = sharedOptions(options, shared);
    if (code === false) return { current: processorBase, shared: resolved };
    // Existing custom Shiki options, language exclusions and Prism use Astro
    // highlighting. EC keeps its highlighter off so excluded fences stay plain,
    // while providing the same frame/clipboard for every selected block.
    // Astro's normalized defaults already exclude math. These managed languages
    // have been handled by Book before EC; treating them as custom exclusions
    // would discard fence titles/markers in every normal Astro build.
    const customExclusions = typeof shared.syntaxHighlight === 'object'
      ? (shared.syntaxHighlight.excludeLangs ?? []).filter((language) =>
        !(language === 'math' && math !== false) && !(language === 'mermaid' && mermaid !== false))
      : [];
    const preserve = Boolean(resolved.shikiConfig?.transformers?.length)
      || resolved.shikiConfig?.wrap === true
      || resolved.shikiConfig?.defaultColor !== undefined
      || customExclusions.length > 0
      || (typeof resolved.syntaxHighlight === 'string' ? resolved.syntaxHighlight : (resolved.syntaxHighlight && resolved.syntaxHighlight.type)) === 'prism';
    const codeOptions = codeOptionsFromShiki(code, resolved.shikiConfig, shared.syntaxHighlight !== false && !preserve);
    const current = unified({ ...processor.options, rehypePlugins: processor.options.rehypePlugins.map((entry) =>
      pluginKey(entry) === rehypeBookCode ? [rehypeBookCode, codeOptions] : entry) });
    return { current, shared: { ...resolved, syntaxHighlight: preserve ? resolved.syntaxHighlight : false as const } };
  }
  processor.createRenderer = (shared) => {
    const value = configured(shared);
    return value.current.createRenderer(value.shared);
  };
  processor.createMdxRenderer = (shared, mdx) => {
    const value = configured(shared);
    return value.current.createMdxRenderer!(value.shared, mdx);
  };
  return processor;
}

/** Programmatic Markdown rendering for a consumer's own content importer. */
export async function createBookMarkdownRenderer(options: BookMarkdownOptions = {}) {
  const renderer = await createBookProcessor(options).createRenderer({});
  return async (markdown: string, fileURL?: URL, frontmatter?: MarkdownRenderOptions['frontmatter']) => {
    const result = await renderer.render(markdown, { fileURL, frontmatter });
    return { html: result.code, headings: result.metadata.headings };
  };
}
