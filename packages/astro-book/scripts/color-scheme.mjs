import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';

function conditionRoot(selector, condition) {
  return selectorParser((selectors) => selectors.each((entry) => {
    const root = entry.nodes.find((node) => node.type === 'pseudo' && node.value === ':where'
      && node.nodes?.some((inner) => inner.nodes?.some((child) => child.type === 'attribute' && child.attribute === 'data-astro-book')));
    if (!root) throw new Error(`Color-scheme rule is missing the theme scope: ${entry}`);
    for (const inner of root.nodes) {
      inner.append(selectorParser().astSync(condition).first.first);
    }
  })).processSync(selector);
}

function updateSelectors(container, condition) {
  container.walkRules((rule) => {
    let ancestor = rule.parent;
    while (ancestor) {
      if (ancestor.type === 'atrule' && /keyframes$/.test(ancestor.name)) return;
      ancestor = ancestor.parent;
    }
    rule.selector = conditionRoot(rule.selector, condition);
  });
}

/** Retain system preference for auto mode, and expose the same rules to manual themes.
 * Snapshot original media nodes before cloning so new nodes are never revisited.
 * Clones remain inside any surrounding width/support/layer conditions.
 */
export function expandColorSchemes(css) {
  const tree = postcss.parse(css.replace(/^\uFEFF/, ''));
  const queries = [];
  tree.walkAtRules('media', (rule) => {
    const match = /^\(\s*prefers-color-scheme\s*:\s*(dark|light)\s*\)$/i.exec(rule.params);
    if (match) queries.push({ rule, mode: match[1].toLowerCase() });
  });
  for (const { rule, mode } of queries) {
    const manual = rule.clone();
    updateSelectors(manual, `[data-book-theme="${mode}"]`);
    updateSelectors(rule, `:not([data-book-theme="${mode === 'dark' ? 'light' : 'dark'}"])`);
    // Remove only this color-preference condition. Nested media queries are retained.
    rule.after([...manual.nodes]);
  }
  return tree.toString();
}
