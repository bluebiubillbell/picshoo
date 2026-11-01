#!/usr/bin/env bash
#
# Deploys picshoo.bingyu.uno. Copies the latest release's Picshoo.zip into
# the site and serves it at /download.
#
#   bash website/deploy.sh
#
set -euo pipefail
cd "$(dirname "$0")"

step() { printf '\n\033[1;34m==>\033[0m %s\n' "$1"; }

step "Fetching the latest release"
tag="$(gh release view --json tagName --jq .tagName)"
rm -f public/Picshoo.zip
gh release download "$tag" --pattern Picshoo.zip --dir public
printf '{"version":"%s"}\n' "${tag#v}" > public/latest.json
echo "  $tag, $(du -h public/Picshoo.zip | cut -f1)"

step "Deploying"
npx --yes wrangler@4 deploy
