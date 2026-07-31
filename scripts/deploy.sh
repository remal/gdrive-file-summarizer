#!/usr/bin/env bash
set -euo pipefail

# Run from the repo root via npm.
root_dir="$(pwd)"
module="$1"

"${root_dir}/scripts/build.sh" "${module}"
cd "${module}"
"${root_dir}/node_modules/.bin/clasp" push
