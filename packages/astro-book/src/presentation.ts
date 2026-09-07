/** Framework-neutral inputs. Date labels, filtering and ordering belong to the site. */
export interface Link { label: string; href: string; target?: '_blank' | '_self'; }
export interface BadgeData { label: string; href?: string; class?: string; title?: string; leadingSpace?: boolean; trailingSpace?: boolean; unstyled?: boolean; }
export interface ArticleMetadata {
  date?: { value: string; label: string };
  tags?: Link[];
  image?: { src: string; alt: string };
}
export interface ArticleItem extends Link {
  metadata?: ArticleMetadata;
  date?: { value: string; label: string };
  breadcrumb?: string;
  summary?: string;
  badges?: BadgeData[];
  prefix?: string;
}
export interface ArticleGroup { label: string; id: string; items: ArticleItem[]; }
export interface TermItem extends Link { count?: number; active?: boolean; size?: number; }
export interface TimelineItem { id?: string; label: string; /** Trusted, authored HTML. */ html: string; }
export interface PortfolioItem extends Link {
  period: string;
  /** Trusted, authored HTML. */ imageHTML?: string;
  tags?: string[];
  /** Trusted, authored HTML paragraphs. */ detailsHTML?: string[];
}
export interface CardItem extends Link { description?: string; image: { src: string; alt: string }; dateLabel?: string; }
export interface SidebarRow extends Link { dateLabel?: string; active?: boolean; }
