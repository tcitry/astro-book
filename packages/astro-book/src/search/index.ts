import { fileURLToPath } from 'node:url';
import { createIndex } from 'pagefind';

export interface BookSearchOptions {
  /** HTML files to index, relative to Astro's build output. Defaults to all HTML files. */
  glob?: string;
  /** Root HTML selector for indexing. Defaults to html; data-pagefind-body further limits searchable content. */
  rootSelector?: string;
}

function assertResponse(response: { errors: string[] }, operation: string) {
  if (response.errors.length) {
    throw new Error(`Pagefind could not ${operation}: ${response.errors.join('\n')}`);
  }
}

/** Index generated HTML and place Pagefind's browser bundle beside it. */
export async function buildSearchIndex(dir: URL, options: BookSearchOptions = {}): Promise<number> {
  const response = await createIndex({ rootSelector: options.rootSelector });
  const { index } = response;
  try {
    assertResponse(response, 'create an index');
    if (!index) throw new Error('Pagefind did not return a search index.');
    const indexed = await index.addDirectory({ path: fileURLToPath(dir), glob: options.glob });
    assertResponse(indexed, 'index the generated HTML');
    const written = await index.writeFiles({ outputPath: fileURLToPath(new URL('./pagefind/', dir)) });
    assertResponse(written, 'write the search bundle');
    return indexed.page_count;
  } finally {
    // Other integrations may own indexes in the same Pagefind service.
    await index?.deleteIndex();
  }
}
