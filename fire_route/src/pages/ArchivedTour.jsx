import { useNavigate } from 'react-router-dom'
import { ClerkProvider, useAuth, SignIn, UserButton } from '@clerk/react'
import './ArchivedTour.css'

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

// Reuses the live tour's own viewer code (public/iGuide/html_assets) rather
// than the separate, differently-versioned bundle sitting in
// public/old_iGuide/ - see public/iGuide/old-tour.html (the property data
// for this archived scan, converted into that bundle's expected format)
// and public/iGuide/sw.js (redirects that bundle's hardcoded live-tour
// CloudFront tile URLs to this scan's own old_iGuide_assets/ bucket
// instead, without touching the shared, third-party bundle itself).
const TOUR_SRC = `${import.meta.env.BASE_URL}iGuide/old-tour.html`

// Owner-only archived 3D scan, not linked from the public Navbar - reachable
// directly at /aug152024. Signed-out visitors see an embedded sign-in form
// instead of any content, same gating pattern as Analytics.jsx.
function ArchivedTourContent() {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) {
    return <div className="layout-wrap route-loading">Loading…</div>
  }

  if (!isSignedIn) {
    return (
      <div className="layout-wrap archived-tour-page archived-tour-page--signed-out">
        <h1>Archived Tour</h1>
        <p className="archived-tour-signin-prompt">Sign in to view this tour.</p>
        {/* Keeps them on this page post-sign-in instead of Clerk's default
            (home) - see Analytics.jsx for why this and routerPush/
            routerReplace below both matter for a Clerk page inside a
            React Router SPA. */}
        <SignIn forceRedirectUrl="/aug152024" />
      </div>
    )
  }

  return (
    <div className="archived-tour-page archived-tour-page--signed-in">
      <div className="archived-tour-user-button">
        <UserButton afterSignOutUrl="/" />
      </div>
      <iframe
        src={TOUR_SRC}
        className="iguide-frame"
        scrolling="no"
        frameBorder="0"
        allowFullScreen
      />
    </div>
  )
}

// ClerkProvider scoped to just this page for the same reason as
// Analytics.jsx - keeps Clerk's SDK weight out of every other page's
// bundle. routerPush/routerReplace route Clerk's own sign-in/sign-out
// navigation through React Router instead of a hard page reload - without
// them, Clerk has no way to know this is an SPA and defaults to
// window.location, which (as found while building Analytics.jsx) can blow
// the page away before other in-flight effects get a chance to run.
export default function ArchivedTour() {
  const navigate = useNavigate()

  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
    >
      <ArchivedTourContent />
    </ClerkProvider>
  )
}
