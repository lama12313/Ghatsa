#!/usr/bin/env bash
# يبني نسخة تشتغل كصفحة Claude Artifact داخل dist-artifact/
set -euo pipefail
cd "$(dirname "$0")/.."
VITE_ARTIFACT=1 npx tsx scripts/build-content.ts
rm -rf dist-artifact
VITE_ARTIFACT=1 npx vite build --outDir dist-artifact >/dev/null
rm -f dist-artifact/q/*.bin dist-artifact/sw.js dist-artifact/workbox-*.js dist-artifact/manifest.webmanifest dist-artifact/registerSW.js dist-artifact/assets/*.woff
JS=$(cd dist-artifact && ls assets/index-*.js)
CSS=$(cd dist-artifact && ls assets/index-*.css)
cat > dist-artifact/ghatsa.html <<HTML
<title>غطسة</title>
<meta name="description" content="غطسة: لعبة تريفيا يومية بالعربي. كل ما كان جوابك أندر، غطست أعمق." />
<script>document.documentElement.lang='ar';document.documentElement.dir='rtl';</script>
<style>:root{color-scheme:dark}html,body{background:#020c16}</style>
<link rel="stylesheet" href="./$CSS">
<div id="root" dir="rtl" lang="ar"></div>
<script type="module" src="./$JS"></script>
HTML
# نرجع public/q للوضع العادي
npx tsx scripts/build-content.ts >/dev/null
(cd dist-artifact && find assets q -type f | sort)
