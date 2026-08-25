import { ClerkProvider, useAuth, SignIn, UserButton } from '@clerk/react'
import Footer from '../components/Footer'
import './Analytics.css'

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

// Owner-only page - not linked from the public Navbar (it's meaningless to
// a vacation-rental guest), reachable directly at /analytics. Signed-out
// visitors see an embedded sign-in form instead of any content.
function AnalyticsContent() {
  const { isLoaded, isSignedIn } = useAuth()

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

  return (
    <div className="layout-wrap analytics-page">
      <div className="analytics-header">
        <h1>Analytics</h1>
        <UserButton afterSignOutUrl="/" />
      </div>
      <p className="analytics-placeholder">
        You're signed in. Site performance and traffic data lives in the AWS CloudWatch RUM
        console for now - this page is a placeholder for pulling that in directly.
      </p>
      <Footer />
    </div>
  )
}

// ClerkProvider (and the rest of the Clerk SDK) is only ever needed on
// this one page, so it's scoped here rather than wrapping the whole app in
// main.jsx - this file is already its own lazily-loaded chunk (see
// App.jsx), so keeping ClerkProvider inside it keeps Clerk's weight out of
// the bundle every other page has to download too, the same way Gallery's
// Motion dependency and the AWS RUM client are both scoped to just where
// they're actually used.
export default function Analytics() {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <AnalyticsContent />
    </ClerkProvider>
  )
}
