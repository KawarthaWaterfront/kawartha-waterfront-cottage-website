// A deliberately lightweight, Clerk-free signal for exactly one thing:
// should the Navbar show an "Analytics" link. Navbar renders on every
// route, and ClerkProvider is intentionally NOT mounted there (see
// Analytics.jsx) so that page's Clerk SDK weight only ever loads for
// someone who actually reaches /analytics, instead of every visitor.
// Analytics.jsx - the one place that holds a real Clerk session - writes
// this flag whenever its own sign-in state changes; Navbar only ever reads
// it, via localStorage plus a same-tab event (localStorage's own `storage`
// event only fires in *other* tabs, never the one that made the change).
//
// This is a UI convenience, not a security boundary - a stale or spoofed
// flag only risks showing a shortcut link to a page that still requires a
// real Clerk sign-in to display anything.
const STORAGE_KEY = 'analytics-signed-in'
const EVENT = 'analytics-auth-change'

export function isAnalyticsSignedIn() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function setAnalyticsSignedIn(signedIn) {
  try {
    if (signedIn) localStorage.setItem(STORAGE_KEY, '1')
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage can throw in private-browsing/storage-blocked contexts - the
    // Navbar link just won't appear, which is a fine fallback.
  }
  window.dispatchEvent(new Event(EVENT))
}

// Calls `callback(signedIn)` whenever the flag changes, in this tab or any
// other. Returns an unsubscribe function for a useEffect cleanup.
export function subscribeAnalyticsSignedIn(callback) {
  const notify = () => callback(isAnalyticsSignedIn())
  const onStorage = (e) => {
    if (e.key === STORAGE_KEY || e.key === null) notify()
  }
  window.addEventListener(EVENT, notify)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(EVENT, notify)
    window.removeEventListener('storage', onStorage)
  }
}
