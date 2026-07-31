# gdrive-file-summarizer

## Naming: trailing underscore

Trailing `_` on a top-level function or `var` hides it from Apps Script's run dropdown and from
library consumers (`Library.name`). Use it everywhere except `process()`, the public entry point.

Whether a top-level `class` (or `const`/arrow function) is reachable as `Library.name` for library
consumers is unverified; test empirically before relying on it either way. `process()` takes a
constructed `LLM` instance, so if a class turns out unreachable, callers need some other way to
obtain one (e.g. a factory function).

Never on class methods/fields, not exposed either way; use `private`.

## Tooling: clasp

`clasp` is a devDependency, not a global install. Run it via `./node_modules/.bin/clasp <command>`
(or `npx clasp <command>`, which resolves to the same local binary).

## Building and deploying

`npm run build` compiles both modules (`library`, `documents-summarizer`) to `<module>/dist`
(gitignored), which is also `clasp`'s push root (`rootDir` in `.clasp.json`). `npm run deploy`
builds, then runs `clasp push` for each module, in the same order.

`clasp push` needs `clasp login` done once beforehand (saves credentials to the user's home
directory, not checked into git) and a `.clasp.json` with a `scriptId` in the module's directory.

Build or deploy a single module with `build:library`, `deploy:library`,
`build:documents-summarizer`, or `deploy:documents-summarizer`.
