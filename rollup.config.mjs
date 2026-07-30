import {readdirSync} from 'node:fs';
import {extname, join} from 'node:path';
import typescript from '@rollup/plugin-typescript';

// Apps Script doesn't support import/export statements. This plugin removes the
// trailing `export { ... };` statement Rollup's ESM output emits, leaving plain
// global functions and classes.
function appsScriptOutput() {
    return {
        name: 'apps-script-output',
        renderChunk(code) {
            return code.replace(/\nexport\s*\{[^}]*\};\n?$/, '');
        },
    };
}

// Every file compiles as its own entry, so Apps Script's shared global scope wires them
// together without any file needing to import another just to be included in the output.
const input = Object.fromEntries(
    readdirSync('src')
        .filter(file => extname(file) === '.ts')
        .map(file => [file.slice(0, -extname(file).length), join('src', file)]),
);

export default {
    input,
    treeshake: false,
    output: {
        dir: 'dist',
        format: 'esm',
        entryFileNames: '[name].js',
    },
    plugins: [typescript(), appsScriptOutput()],
};
