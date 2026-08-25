import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import './App.css'
import Navbar from './components/Navbar'
import Home from './pages/Home'

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

export default function App() {
  const location = useLocation()

  useEffect(() => {
    // This is a single-page app (client-side routing via BrowserRouter) - AWS
    // RUM's automatic tracking only ever sees the one real page load, with
    // no way to know a route change even happened. Recording a page view
    // on every path change is what makes per-page performance/analytics
    // show up correctly in RUM instead of everything being attributed to
    // whatever route happened to be loaded first.
    //
    // `./rum.js` is dynamically imported (rather than a static import) so
    // this doesn't force the ~85KB RUM client into App's own bundle -
    // main.jsx already triggers that same import on idle, and since
    // dynamic imports of the same specifier are cached by the module
    // system, this reuses that one already-initialized instance rather
    // than constructing a second client.
    import('./rum.js').then(({ default: awsRum }) => {
      awsRum?.recordPageView(location.pathname)
    })
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
