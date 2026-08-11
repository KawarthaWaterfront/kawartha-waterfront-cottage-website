import { Link } from 'react-router-dom'
import Carousel from '../components/Carousel'
import VideoPlayer from '../components/VideoPlayer'
import './Home.css'

const SHOW_REVIEW_RATINGS = false

const STATS = [
  {
    label: '230 ft of waterfront',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M2 17c1.5-1.5 3-1.5 4.5 0s3 1.5 4.5 0 3-1.5 4.5 0 3 1.5 4.5 0" />
        <path d="M2 12c1.5-1.5 3-1.5 4.5 0s3 1.5 4.5 0 3-1.5 4.5 0 3 1.5 4.5 0" />
        <path d="M12 3v6" />
      </svg>
    ),
  },
  {
    label: '4 bedrooms',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M3 11V6a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v5" />
        <path d="M12 11V8a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v5" />
        <path d="M2 17h20" />
        <path d="M2 11h20v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z" />
      </svg>
    ),
  },
  {
    label: '2 bathrooms',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M9 6V4a2 2 0 0 1 4 0v2" />
        <path d="M4 11h16v2a6 6 0 0 1-6 6H10a6 6 0 0 1-6-6z" />
        <path d="M4 19h16" />
      </svg>
    ),
  },
  {
    label: 'Sleeps 10',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <circle cx="9" cy="8" r="3" />
        <path d="M2 20c0-3.3 3.1-6 7-6s7 2.7 7 6" />
        <circle cx="18" cy="9" r="2.5" />
        <path d="M16.5 14.3c2.7.4 4.5 2.5 4.5 5.7" />
      </svg>
    ),
  },
]

export default function Home() {
  return (
    <div className="layout-wrap">
      <section id="center">
        <div className="hero-eyebrow">Northern shores of Pigeon Lake, Trent Lakes, Ontario</div>
        <h1>La Picholine - Vacation Rental</h1>
        <p className="hero-subtitle">
          Originally a hunting lodge, this modern rustic waterfront cottage is the perfect getaway
          for a multi-generational family or a pair of families.
        </p>

        <div className="hero-stats">
          {STATS.map(({ label, icon }) => (
            <div className="hero-stat" key={label}>
              <span className="hero-stat-icon">{icon}</span>
              <span className="hero-stat-label">{label}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="property-video">
        <VideoPlayer />
        <div className="home-book-cta">
          <Link className="home-book-btn" to="/iguide">
            View 3D Tour
          </Link>
          <Link className="home-book-btn" to="/gallery">
            View Photo Gallery
          </Link>
        </div>
      </section>

      <Carousel showRatings={SHOW_REVIEW_RATINGS} />

      <footer className="home-footer">
        <div className="home-footer-inner">
          <div className="home-footer-brand">
            <div className="home-footer-name">La Picholine</div>
            <div className="home-footer-location">Pigeon Lake, Ontario</div>
          </div>

          <div className="home-footer-socials">
            <a
              href="https://www.youtube.com/@KawarthaWaterfrontCottage"
              target="_blank"
              rel="noreferrer"
              aria-label="YouTube"
            >
              <svg className="home-footer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21.58 7.19a2.51 2.51 0 0 0-1.77-1.78C18.25 5 12 5 12 5s-6.25 0-7.81.41a2.51 2.51 0 0 0-1.77 1.78A26.4 26.4 0 0 0 2 12a26.4 26.4 0 0 0 .42 4.81 2.51 2.51 0 0 0 1.77 1.78C5.75 19 12 19 12 19s6.25 0 7.81-.41a2.51 2.51 0 0 0 1.77-1.78A26.4 26.4 0 0 0 22 12a26.4 26.4 0 0 0-.42-4.81z" />
                <polygon points="10 15 15 12 10 9 10 15" fill="currentColor" stroke="none" />
              </svg>
            </a>
            <a
              href="https://www.instagram.com/kawarthawaterfrontcottage/"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
            >
              <svg className="home-footer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
              </svg>
            </a>
          </div>

          <div className="home-footer-contact">
            <a href="https://www.cottagesincanada.com/42737" target="_blank" rel="noreferrer">
              Book Your Stay With Us
            </a>
            <a href="mailto:kawarthawaterfrontcottage@gmail.com">
              kawarthawaterfrontcottage@gmail.com
            </a>
            <a href="tel:+16472868630">647-286-8630</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
