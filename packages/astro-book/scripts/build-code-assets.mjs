import { mkdir, writeFile, cp } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { toHtml } from 'rehype-expressive-code/hast';
import { getBookCodeResources } from '../dist/markdown/code.js';

const destination = fileURLToPath(new URL('../dist/', import.meta.url));
const resources = await getBookCodeResources();
const frame = await resources.ec.render({ code: '', language: 'text', meta: '' });
await mkdir(destination, { recursive: true });
await writeFile(path.join(destination, 'code-styles.css'), [resources.baseStyles, resources.themeStyles, ...frame.styles].join('\n'));
await writeFile(path.join(destination, 'code-copy.js'), '/*! Expressive Code 0.44.2 | MIT | see EXPRESSIVE-CODE-LICENSE */\n' + resources.jsModules.join('\n'));
await writeFile(path.join(destination, 'code-copy-template.html'), toHtml(frame.renderedGroupAst));
const require = createRequire(import.meta.url);
const packageDirectory = path.resolve(path.dirname(require.resolve('@expressive-code/plugin-frames')), '..');
await cp(path.join(packageDirectory, 'LICENSE'), path.join(destination, 'EXPRESSIVE-CODE-LICENSE'));
console.log('Built shared Expressive Code styles, frame template and official clipboard module.');
