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
    // Process.ts (Code.js) is the provider-agnostic library entry point; it must not import
    // GeminiLLM.ts. Compiling it as a separate entry keeps it in the deployed Apps Script
    // project (all files in a project share one global scope) without that import.
    input: {
        Code: 'src/Process.ts',
        GeminiLLM: 'src/GeminiLLM.ts',
    },
    treeshake: false,
    output: {
        dir: 'dist',
        format: 'esm',
        entryFileNames: '[name].js',
    },
    plugins: [typescript(), appsScriptOutput()],
};
