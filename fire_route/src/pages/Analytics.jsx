import { useCallback, useEffect, useState } from 'react'
import { ClerkProvider, useAuth, SignIn, UserButton } from '@clerk/react'
import Footer from '../components/Footer'
import './Analytics.css'

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
const REALTIME_API_URL = import.meta.env.VITE_ANALYTICS_REALTIME_API_URL

// GA4's realtime data set only covers roughly the last 30 minutes and
// changes by the minute, so this re-polls on an interval rather than
// fetching once - matches what "realtime" means here, not a historical
// report you'd only need to pull on demand.
const POLL_INTERVAL_MS = 30_000

const compactNumber = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 })

function formatDuration(totalSeconds) {
  const seconds = Math.round(totalSeconds || 0)
  if (seconds < 60) return `${seconds}s`
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
}

// Talks to a small Lambda (source in /lambda/ga-realtime, deployed
// separately - this repo is a static SPA with no backend of its own) that
// holds the Google service-account credential and calls the GA4 Data API
// server-side. The browser only ever sees the resulting JSON - summary
// figures, top pages, locations, and traffic sources - never any Google
// credentials.
function useRealtimeStats(enabled) {
  const [state, setState] = useState({ status: 'idle', data: null, error: null })

  const load = useCallback(() => {
    if (!REALTIME_API_URL) {
      setState({ status: 'error', data: null, error: 'VITE_ANALYTICS_REALTIME_API_URL is not set.' })
      return
    }
    setState((prev) => ({ ...prev, status: prev.data ? 'refreshing' : 'loading' }))
    fetch(REALTIME_API_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`Request failed (${r.status})`)
        return r.json()
      })
      .then((data) => setState({ status: 'loaded', data, error: null }))
      .catch((error) => setState({ status: 'error', data: null, error: error.message }))
  }, [])

  useEffect(() => {
    if (!enabled) return
    load()
    const id = setInterval(load, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [enabled, load])

  return { ...state, refresh: load }
}

// One row shared by the pages/locations/traffic-source lists: a title (with
// an optional muted subtitle) on the left, a headline count with an
// optional small meta label on the right. Direct-labels only where a second
// number actually adds information, per the site's dataviz conventions.
function StatRow({ title, subtitle, count, metaLabel }) {
  return (
    <li className="analytics-row">
      <div className="analytics-row-text">
        <span className="analytics-row-title">{title}</span>
        {subtitle && <span className="analytics-row-subtitle">{subtitle}</span>}
      </div>
      <div className="analytics-row-figures">
        <span className="analytics-row-count">{compactNumber.format(count)}</span>
        {metaLabel && <span className="analytics-row-metalabel">{metaLabel}</span>}
      </div>
    </li>
  )
}

function Section({ heading, children }) {
  return (
    <div className="analytics-section">
      <h2 className="analytics-section-heading">{heading}</h2>
      <ul className="analytics-section-list">{children}</ul>
    </div>
  )
}

// Owner-only page - not linked from the public Navbar (it's meaningless to
// a vacation-rental guest), reachable directly at /analytics. Signed-out
// visitors see an embedded sign-in form instead of any content.
function AnalyticsContent() {
  const { isLoaded, isSignedIn } = useAuth()
  const stats = useRealtimeStats(isSignedIn === true)

  if (!isLoaded) {
    return <div className="layout-wrap route-loading">Loading…</div>
  }

  if (!isSignedIn) {
    return (
      <div className="layout-wrap analytics-page analytics-page--signed-out">
        <h1>Analytics</h1>
        <p className="analytics-signin-prompt">Sign in to view site analytics.</p>
        <SignIn />
      </div>
    )
  }

  // The Lambda's own README walks through deploying it - until then (or if
  // the fetch fails), say so plainly instead of rendering a 0 that looks
  // like real data.
  const summary = stats.data?.summary
  const hasData = typeof summary?.activeUsers === 'number'

  return (
    <div className="layout-wrap analytics-page">
      <div className="analytics-header">
        <h1>Analytics</h1>
        <UserButton afterSignOutUrl="/" />
      </div>

      {stats.status === 'loading' && <p className="analytics-placeholder">Loading…</p>}

      {stats.status === 'error' && (
        <p className="analytics-placeholder">Couldn't load realtime stats: {stats.error}</p>
      )}

      {(stats.status === 'loaded' || stats.status === 'refreshing') && !hasData && (
        <p className="analytics-placeholder">
          Connected to the stats endpoint, but it hasn't returned real numbers yet - deploy the
          handler in <code>/lambda/ga-realtime</code> (see its README) to replace this.
        </p>
      )}

      {hasData && (
        <>
          <div className="analytics-hero">
            <span className="analytics-hero-value">{compactNumber.format(summary.activeUsers)}</span>
            <span className="analytics-hero-label">active on the site right now</span>
          </div>

          <div className="analytics-summary-grid">
            <div className="analytics-summary-stat">
              <span className="analytics-summary-value">{compactNumber.format(summary.totalUsers)}</span>
              <span className="analytics-summary-label">total users</span>
            </div>
            <div className="analytics-summary-stat">
              <span className="analytics-summary-value">{compactNumber.format(summary.screenPageViews)}</span>
              <span className="analytics-summary-label">page views</span>
            </div>
            <div className="analytics-summary-stat">
              <span className="analytics-summary-value">{formatDuration(summary.totalEngagementSeconds)}</span>
              <span className="analytics-summary-label">engagement time</span>
            </div>
          </div>

          {stats.data.pagesVisited?.length > 0 && (
            <Section heading="Pages visited">
              {stats.data.pagesVisited.map((p) => (
                <StatRow
                  key={p.pagePath}
                  title={p.pageTitle || p.pagePath}
                  subtitle={p.pagePath}
                  count={p.activeUsers}
                  metaLabel={`${compactNumber.format(p.views)} views · ${formatDuration(p.avgEngagementSeconds)} avg`}
                />
              ))}
            </Section>
          )}

          {stats.data.locations?.length > 0 && (
            <Section heading="Locations">
              {stats.data.locations.map((loc, i) => (
                <StatRow
                  key={`${loc.city}-${loc.country}-${i}`}
                  title={[loc.city, loc.country].filter(Boolean).join(', ') || 'Unknown'}
                  count={loc.activeUsers}
                />
              ))}
            </Section>
          )}

          {stats.data.trafficSources?.length > 0 && (
            <Section heading="Traffic sources">
              {stats.data.trafficSources.map((s, i) => (
                <StatRow
                  key={`${s.source}-${s.medium}-${i}`}
                  title={`${s.source} / ${s.medium}`}
                  count={s.activeUsers}
                  metaLabel={`${compactNumber.format(s.sessions)} sessions`}
                />
              ))}
            </Section>
          )}

          <button type="button" className="analytics-refresh-btn" onClick={stats.refresh}>
            {stats.status === 'refreshing' ? 'Refreshing…' : 'Refresh now'}
          </button>
        </>
      )}

      <Footer />
    </div>
  )
}

// ClerkProvider (and the rest of the Clerk SDK) is only ever needed on
// this one page, so it's scoped here rather than wrapping the whole app in
// main.jsx - this file is already its own lazily-loaded chunk (see
// App.jsx), so keeping ClerkProvider inside it keeps Clerk's weight out of
// the bundle every other page has to download too, the same way Gallery's
// Motion dependency was scoped to just where it's actually used.
export default function Analytics() {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <AnalyticsContent />
    </ClerkProvider>
  )
}
