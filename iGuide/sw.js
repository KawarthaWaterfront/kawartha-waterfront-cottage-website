// Only ever registered by old-tour.html, scoped to that one page (see its
// registration call) - the live tour at index.html is never controlled by
// this and is completely unaffected.
//
// html_assets/index.js (shared by both pages) has this property's real
// CloudFront tile bucket hardcoded as a literal string with no config hook
// to point it elsewhere:
//   "https://d13umf114s6tcz.cloudfront.net/iGuide-assets/p" + id + "-" + face + ".jpg"
// old-tour.html needs the exact same viewer code to instead load the
// archived scan's tiles from this project's own bucket. Rewriting requests
// at the network level here works regardless of *how* index.js actually
// issues them internally (fetch, XHR, an <img> tag, a WebGL texture
// loader...) - which matters since that's third-party minified code this
// project doesn't control and hasn't fully reverse-engineered.
const IGUIDE_TILE_PREFIX = 'https://d13umf114s6tcz.cloudfront.net/iGuide-assets/'
// Underscored, matching the actual S3 key prefix (fire-route-bucket/old_iGuide_assets/)
// - not the hyphenated guess this originally shipped with.
const OLD_TOUR_ASSETS_BASE = 'https://dqcnq5a81vup8.cloudfront.net/old_iGuide_assets/'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  // Without this, a SW only starts controlling pages on their *next*
  // navigation - old-tour.html's bootstrap script needs this same page
  // load to already be controlled once activation finishes, since that's
  // the signal it waits on before letting html_assets/index.js run (and
  // start requesting tiles).
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  const url = event.request.url
  if (url.startsWith(IGUIDE_TILE_PREFIX)) {
    const filename = url.slice(IGUIDE_TILE_PREFIX.length)
    const rewritten = OLD_TOUR_ASSETS_BASE + filename
    console.log('[old-tour sw] rewriting', url, '->', rewritten)
    event.respondWith(fetch(rewritten))
  }
  // Everything else (the html_assets JS/CSS/fonts/images this page also
  // loads from its own origin) passes through untouched - the browser's
  // default handling applies whenever respondWith isn't called.
})
