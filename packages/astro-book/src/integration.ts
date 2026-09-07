import type { AstroIntegration } from 'astro';
import mdx from '@astrojs/mdx';
import { isUnifiedProcessor, type UnifiedProcessorOptions } from '@astrojs/markdown-remark';
import { createBookProcessor, uniquePlugins, type BookMarkdownOptions, type MermaidOptions } from './markdown/index.ts';
import { buildSearchIndex, type BookSearchOptions } from './search/index.ts';

export type { BookSearchOptions } from './search/index.ts';

export interface AstroBookOptions {
  /** KaTeX, Mermaid, Expressive Code and consumer remark/rehype/recma plugins share one pipeline. */
  markdown?: BookMarkdownOptions;
  /** Runtime-safe Mermaid options; a layout can override them per page. */
  mermaid?: MermaidOptions | false;
  /** Adds @astrojs/mdx unless already configured. Set false for Markdown-only sites. */
  mdx?: boolean;
  /** Builds a Pagefind index after Astro renders HTML. False disables indexing; the layout controls its search UI separately. */
  search?: BookSearchOptions | false;
}

/** Static theme integration. No framework renderer, content loader, routes, or backend is installed. */
export default function astroBook(options: AstroBookOptions = {}): AstroIntegration {
  return {
    name: '@tcitry/astro-book',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        if (options.search === false) return;
        const count = await buildSearchIndex(dir, options.search);
        logger.info(`Pagefind indexed ${count} HTML ${count === 1 ? 'page' : 'pages'}.`);
      },
      'astro:config:setup': ({ config, updateConfig }) => {
        if (config.integrations.filter((item) => item.name === '@tcitry/astro-book').length > 1) {
          throw new Error('Configure astroBook() once. Add Markdown plugins through its markdown option.');
        }
        const previous = config.markdown.processor;
        if (previous && !isUnifiedProcessor(previous) && previous.name !== 'satteri') {
          throw new Error(`astro-book uses a unified Markdown/MDX pipeline. Remove the explicit ${previous.name} processor, or use theme components without the integration.`);
        }
        const inherited: UnifiedProcessorOptions = previous && isUnifiedProcessor(previous) ? previous.options : {};
        const extra = options.markdown ?? {};
        const processor = createBookProcessor({
          ...inherited,
          ...extra,
          mermaid: options.mermaid ?? extra.mermaid,
          remarkPlugins: uniquePlugins([...(inherited.remarkPlugins ?? []), ...(config.markdown.remarkPlugins ?? []), ...(extra.remarkPlugins ?? [])]),
          rehypePlugins: uniquePlugins([...(inherited.rehypePlugins ?? []), ...(config.markdown.rehypePlugins ?? []), ...(extra.rehypePlugins ?? [])]),
          recmaPlugins: uniquePlugins([...(inherited.recmaPlugins ?? []), ...(extra.recmaPlugins ?? [])]),
        });
        // Assign the complete processor: Astro's recursive config merger concatenates plugin arrays.
        // Keeping one instance also means MDX inherits precisely the same processor at config:done.
        config.markdown.processor = processor;
        config.markdown.remarkPlugins = [];
        config.markdown.rehypePlugins = [];
        if (options.mdx !== false && !config.integrations.some((item) => item.name === '@astrojs/mdx')) {
          updateConfig({ integrations: [mdx()] });
        }
      },
    },
  };
}
