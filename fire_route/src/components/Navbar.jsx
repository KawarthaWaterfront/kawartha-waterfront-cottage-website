import { useState, useEffect } from 'react'
import { Link, NavLink } from 'react-router-dom'
import BookingModal from './BookingModal'
import './Navbar.css'

const LOGO_SRC = `${import.meta.env.BASE_URL}icons/${encodeURIComponent('la picholine logo - final.png')}`

// Keeps the top navbar pinned in place while scrolling on wide screens
// (it still scrolls away below the mobile breakpoint, where it's replaced by
// the persistent floating hamburger button). Flip to false to go back to the
// nav scrolling out of view with the page.
const STICKY_NAV_ON_WIDE_SCREENS = true

const NAV_ITEMS = [
  { label: 'Home', to: '/' },
  { label: 'Cottage', to: '/cottage' },
  { label: 'Gallery', to: '/gallery' },
  { label: 'Activities', to: '/activities' },
  { label: 'Book', modal: true },
  { label: '3D Tour', to: '/iguide' },
]

const SOCIAL_LINKS = [
  {
    name: 'Instagram',
    href: 'https://www.instagram.com/kawarthawaterfrontcottage/',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    name: 'YouTube',
    href: 'https://www.youtube.com/@KawarthaWaterfrontCottage',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21.58 7.19a2.51 2.51 0 0 0-1.77-1.78C18.25 5 12 5 12 5s-6.25 0-7.81.41a2.51 2.51 0 0 0-1.77 1.78A26.4 26.4 0 0 0 2 12a26.4 26.4 0 0 0 .42 4.81 2.51 2.51 0 0 0 1.77 1.78C5.75 19 12 19 12 19s6.25 0 7.81-.41a2.51 2.51 0 0 0 1.77-1.78A26.4 26.4 0 0 0 22 12a26.4 26.4 0 0 0-.42-4.81z" />
        <polygon points="10 15 15 12 10 9 10 15" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [bookingOpen, setBookingOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setSidebarOpen(false)
  }

  const openBooking = () => {
    setSidebarOpen(false)
    setBookingOpen(true)
  }

  const renderItem = ({ label, to, anchor, modal }) => {
    if (to) return <NavLink to={to} end onClick={() => setSidebarOpen(false)}>{label}</NavLink>
    if (modal) return <button onClick={openBooking}>{label}</button>
    return <a href={`#${anchor}`} onClick={(e) => { e.preventDefault(); scrollTo(anchor) }}>{label}</a>
  }

  return (
    <>
      <nav className={`navbar${STICKY_NAV_ON_WIDE_SCREENS ? ' navbar--sticky' : ''}`}>
        <Link className="nav-logo" to="/">
          <img src={LOGO_SRC} alt="72 Fire Rte 98" className="nav-logo-img" />
        </Link>
        <div className="nav-right">
          <ul className="nav-links">
            {NAV_ITEMS.map((item) => (
              <li key={item.label}>{renderItem(item)}</li>
            ))}
          </ul>
          <ul className="nav-socials">
            {SOCIAL_LINKS.map(({ name, href, icon }) => (
              <li key={name}>
                <a href={href} target="_blank" rel="noreferrer" aria-label={name}>{icon}</a>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <button
        className={`menu-btn${scrolled && !STICKY_NAV_ON_WIDE_SCREENS ? ' menu-btn--visible' : ''}`}
        onClick={() => setSidebarOpen(true)}
        aria-label="Open menu"
      >
        <span /><span /><span />
      </button>

      <aside className={`sidebar${sidebarOpen ? ' sidebar--open' : ''}`}>
        <button className="sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close menu">✕</button>
        <Link className="sidebar-logo" to="/" onClick={() => setSidebarOpen(false)}>
          <img src={LOGO_SRC} alt="72 Fire Rte 98" className="sidebar-logo-img" />
        </Link>
        <ul className="sidebar-links">
          {NAV_ITEMS.map((item) => (
            <li key={item.label}>{renderItem(item)}</li>
          ))}
        </ul>
        <ul className="sidebar-socials">
          {SOCIAL_LINKS.map(({ name, href, icon }) => (
            <li key={name}>
              <a href={href} target="_blank" rel="noreferrer" aria-label={name}>{icon}</a>
            </li>
          ))}
        </ul>
      </aside>
      <div
        className={`sidebar-overlay${sidebarOpen ? ' sidebar-overlay--visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <BookingModal open={bookingOpen} onClose={() => setBookingOpen(false)} />
    </>
  )
}
