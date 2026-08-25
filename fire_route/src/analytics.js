// Google Analytics (GA4). The gtag.js loader itself lives in index.html as
// a plain <script async> tag - unlike aws-rum-web before it, gtag.js isn't
// an npm dependency bundled into our own JS at all, so there's no bundle
// weight to defer here. This module just wraps `window.gtag` so the rest
// of the app doesn't need to know whether it's actually loaded yet (an ad
// blocker, a slow network, or a disabled-JS crawler can all mean it never
// shows up, and gtag() calls before the loader finishes are queued
// automatically by the snippet in index.html - this only guards the case
// where it never arrives at all).
export function trackPageView(path) {
  if (typeof window.gtag !== 'function') return
  window.gtag('event', 'page_view', { page_path: path })
}
