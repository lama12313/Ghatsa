#!/usr/bin/env bash
# يبني اللعبة وينشرها على فرع gh-pages (GitHub Pages)
set -euo pipefail
cd "$(dirname "$0")/.."
npm run build
TMP=$(mktemp -d)
cp -r dist/. "$TMP/"
touch "$TMP/.nojekyll"
REMOTE=$(git remote get-url origin)
cd "$TMP"
git init -q -b gh-pages
git add -A
git -c user.name="ghatsa-deploy" -c user.email="deploy@ghatsa.local" commit -q -m "نشر $(date -u +%Y-%m-%dT%H:%MZ)"
git push -f -q "$REMOTE" gh-pages
echo "✅ انتشر على gh-pages"
