import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
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

export default function App() {
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
        </Routes>
      </Suspense>
    </>
  )
}
