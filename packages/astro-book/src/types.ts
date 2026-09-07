/** Framework-neutral presentation inputs. Content and URL policy belong to consumers. */
export interface BookHeading { depth: number; slug: string; text: string }
export type Heading = BookHeading;
export interface HeadingNode extends BookHeading { children: HeadingNode[] }
export interface BookPage {
  title: string;
  url: string;
  headings?: BookHeading[];
  toc?: boolean;
  bodyClass?: string;
  description?: string;
}
export interface NavigationItem {
  id: string;
  label: string;
  href?: string;
  icon?: string;
  active?: boolean;
  expanded?: boolean;
  collapsible?: boolean;
  flat?: boolean;
  external?: boolean;
  children?: NavigationItem[];
}
export interface BookSite {
  title: string;
  home?: string;
  logo?: string;
  favicon?: string;
  lang?: string;
  dir?: 'ltr' | 'rtl';
  menu?: NavigationItem[];
}
export interface PageLink { title: string; url: string }
export interface SEOData {
  title?: string;
  openGraphTitle?: string;
  description?: string;
  canonical?: string;
  robots?: string;
  siteName?: string;
  locale?: string;
  type?: 'website' | 'article';
  image?: string;
  twitterSite?: string;
  feeds?: { title: string; href: string; type?: string }[];
  structuredData?: Record<string, unknown> | Record<string, unknown>[];
}
export interface SearchConfig {
  /** URL containing Pagefind's generated pagefind-ui.js and CSS. */
  basePath?: string;
  placeholder?: string;
  loadingMessage?: string;
  errorMessage?: string;
  translations?: Record<string, string>;
  showImages?: boolean;
  showSubResults?: boolean;
}
export type BookTheme = 'auto' | 'light' | 'dark';
/** Serializable Mermaid initialization options; strict security is always enforced. */
export interface MermaidClientOptions {
  theme?: string;
  darkTheme?: string;
  errorMessage?: string;
  [option: string]: unknown;
}
export interface GiscusConfig {
  repo: string;
  repoId: string;
  category: string;
  categoryId: string;
  mapping?: 'pathname' | 'url' | 'title' | 'og:title' | 'specific' | 'number';
  term?: string;
  strict?: boolean;
  reactionsEnabled?: boolean;
  emitMetadata?: boolean;
  inputPosition?: 'top' | 'bottom';
  theme?: string;
  lang?: string;
  loading?: 'lazy' | 'eager';
}
export interface BookLabels {
  skipToContent: string;
  navigation: string;
  openNavigation: string;
  closeNavigation: string;
  tableOfContents: string;
  openTableOfContents: string;
  expandSection: string;
  previousPage: string;
  nextPage: string;
  search: string;
  closeSearch: string;
}
/** Replacements accept the same typed props as the exported default component. */
export interface BookComponents {
  Navigation?: typeof import('./components/NavigationTree.astro').default;
  TOC?: typeof import('./components/HeadingTree.astro').default;
  Search?: typeof import('./components/Search.astro').default;
  Footer?: typeof import('./components/PageNavigation.astro').default;
}
export interface BookLayoutProps {
  site: BookSite;
  page: BookPage;
  navigation?: NavigationItem[];
  search?: SearchConfig | false;
  seo?: SEOData;
  previous?: PageLink;
  next?: PageLink;
  theme?: BookTheme;
  mermaid?: MermaidClientOptions | false;
  /** Add a small copy control to unmanaged code. Set false alongside markdown.code:false for consumer rendering. Mermaid source copying remains enabled. */
  code?: boolean;
  labels?: Partial<BookLabels>;
  components?: BookComponents;
}
