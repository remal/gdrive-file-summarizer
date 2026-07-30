import typescript from '@rollup/plugin-typescript';

// Apps Script doesn't support import/export statements. Rollup's tree shaking
// drops the entry chunk once its exports are stripped, since nothing outside
// the bundle references them. This plugin keeps the entry chunk and removes
// the trailing `export { ... };` statement, leaving plain global functions.
function appsScriptOutput() {
    return {
        name: 'apps-script-output',
        async resolveId(source, importer, options) {
            if (!importer) {
                const resolution = await this.resolve(source, importer, {skipSelf: true, ...options});
                if (resolution) {
                    resolution.moduleSideEffects = 'no-treeshake';
                }
                return resolution;
            }
            return null;
        },
        renderChunk(code) {
            return code.replace(/\nexport\s*\{[^}]*\};\n?$/, '');
        },
    };
}

export default {
    input: 'src/Process.ts',
    output: {
        dir: 'dist',
        format: 'esm',
        entryFileNames: 'Code.js',
    },
    plugins: [typescript(), appsScriptOutput()],
};
