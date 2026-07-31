import {readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

// Apps Script has no module loader: every file in a project shares one global scope, so
// cross-file references already work without import/export. tsc still emits them per ES2020
// module semantics, so strip them here rather than rewriting the source to drop modules.
export function stripModules(dir) {
    for (const file of readdirSync(dir).filter(name => name.endsWith('.js'))) {
        const path = join(dir, file);
        const code = readFileSync(path, 'utf8')
            .replace(/^import\b[^;]*;\s*\n?/gm, '')
            .replace(/^export\s+/gm, '');
        writeFileSync(path, code);
    }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    stripModules(process.argv[2] ?? 'dist');
}
