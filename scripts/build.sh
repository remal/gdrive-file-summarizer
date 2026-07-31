#!/usr/bin/env bash
set -euo pipefail

# Run from the repo root via npm (each project module has its own tsconfig.json/appsscript.json).
root_dir="$(pwd)"
module="$1"

cd "${module}"
rm -rf dist
"${root_dir}/node_modules/.bin/tsc" --project tsconfig.json
node "${root_dir}/scripts/strip-modules.mjs" dist
cp appsscript.json dist/
