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
