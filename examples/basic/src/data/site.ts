import type { NavigationItem } from '@tcitry/astro-book/types';

/** Site URLs belong to this example, rather than the theme package. */
export const withBase = (path = '') => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
export const sourceRoot = 'https://github.com/tcitry/astro-book/tree/main/examples/basic';
export const pages = [
  { slug: '', title: 'Astro Book', file: 'index.astro' },
  { slug: 'getting-started/', title: 'Getting started', file: 'getting-started.md' },
  { slug: 'structure/', title: 'Project structure', file: 'structure.md' },
  { slug: 'typography/', title: 'Typography', file: 'typography.md' },
  { slug: 'markdown/', title: 'Markdown', file: 'markdown.md' },
  { slug: 'mdx/', title: 'MDX', file: 'mdx.mdx' },
  { slug: 'code/', title: 'Code blocks', file: 'code.md' },
  { slug: 'math/', title: 'Mathematics', file: 'math.md' },
  { slug: 'mermaid/', title: 'Mermaid diagrams', file: 'mermaid.md' },
  { slug: 'components/', title: 'Components', file: 'components.astro' },
  { slug: 'configuration/', title: 'Configuration', file: 'configuration.md' },
  { slug: 'customization/', title: 'Customization', file: 'customization.md' },
  { slug: 'deployment/', title: 'Deployment', file: 'deployment.md' },
];
const link = (entry: typeof pages[number], current: string): NavigationItem => ({
  id: entry.slug || 'home', label: entry.title, href: withBase(entry.slug), active: current === withBase(entry.slug),
});
export function navigation(current: string): NavigationItem[] {
  return [
    link(pages[0], current),
    { id: 'start', label: 'Start here', collapsible: true, expanded: true, children: pages.slice(1, 3).map((entry) => link(entry, current)) },
    { id: 'writing', label: 'Writing', collapsible: true, expanded: true, children: pages.slice(3, 9).map((entry) => link(entry, current)) },
    link(pages[9], current),
    { id: 'build', label: 'Make it yours', collapsible: true, expanded: true, children: pages.slice(10).map((entry) => link(entry, current)) },
  ];
}
