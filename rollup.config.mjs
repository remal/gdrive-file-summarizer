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

export default {
    input: 'src/Process.ts',
    treeshake: false,
    output: {
        dir: 'dist',
        format: 'esm',
        entryFileNames: 'Code.js',
    },
    plugins: [typescript(), appsScriptOutput()],
};
