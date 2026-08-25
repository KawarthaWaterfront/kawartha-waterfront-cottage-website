import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import './App.css'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import { trackPageView } from './analytics'

// Every other page - and everything they import (Gallery alone pulls in
// the Motion animation library) - used to be bundled eagerly into the same
// JS file as Home, so visiting "/" downloaded and parsed all of it before
// anything could render. Lazy-loading them means a first-time visitor only
// pays for Home + Navbar up front; each other page's own chunk (and its
// dependencies) only loads the moment someone actually navigates there.
const IGuide = lazy(() => import('./pages/IGuide'))
const Gallery = lazy(() => import('./pages/Gallery'))
const Amenities = lazy(() => import('./pages/Amenities'))
const Activities = lazy(() => import('./pages/Activities'))
const Analytics = lazy(() => import('./pages/Analytics'))

// index.html's static <title> only ever covers the initial load - once
// BrowserRouter swaps routes client-side, the tab/bookmark/history-entry
// title would otherwise stay "Kawartha Waterfront Cottage" no matter which
// page is showing. Keyed by path (matching Navbar's own labels) rather than
// living in each page component, since it changes for the exact same
// trigger - a route change - that trackPageView below already handles.
const SITE_NAME = 'Kawartha Waterfront Cottage'
const PAGE_TITLES = {
  '/': SITE_NAME,
  '/amenities': `Amenities | ${SITE_NAME}`,
  '/activities': `Activities | ${SITE_NAME}`,
  '/iguide': `3D Tour | ${SITE_NAME}`,
  '/gallery': `Gallery | ${SITE_NAME}`,
  '/analytics': `Analytics | ${SITE_NAME}`,
}

export default function App() {
  const location = useLocation()

  useEffect(() => {
    document.title = PAGE_TITLES[location.pathname] ?? SITE_NAME

    // This is a single-page app (client-side routing via BrowserRouter) -
    // GA's own automatic pageview only ever fires for the one real page
    // load (send_page_view is off in index.html specifically because of
    // this), with no way to know a route change happened afterward.
    // Recording a page_view event on every path change - including the
    // first one - is what makes GA attribute traffic to the actual page
    // visited instead of everything showing up as the landing route.
    trackPageView(location.pathname)
  }, [location.pathname])

  return (
    <>
      <div className="bg-gradient" aria-hidden="true" />
      <div className="bg-noise" aria-hidden="true" />
      <Navbar />
      <Suspense fallback={<div className="route-loading">Loading…</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/iguide" element={<IGuide />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/amenities" element={<Amenities />} />
          <Route path="/activities" element={<Activities />} />
          <Route path="/analytics" element={<Analytics />} />
        </Routes>
      </Suspense>
    </>
  )
}
