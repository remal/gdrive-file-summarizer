# gdrive-file-summarizer

## Naming: trailing underscore

Trailing `_` on a top-level function or `var` hides it from Apps Script's run dropdown and from
library consumers (`Library.name`). Use it everywhere except `process()`, the public entry point.

Classes and top-level `const`/arrow functions are never exposed to library consumers under V8,
regardless of naming; a class needs a `function` factory wrapper to be reachable at all (unresolved
for `GeminiLLM`).

Never on class methods/fields, not exposed either way; use `private`.
