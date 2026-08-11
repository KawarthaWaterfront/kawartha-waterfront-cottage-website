const PLATFORMS = [
  {
    name: 'Book Now',
    href: 'https://www.cottagesincanada.com/42737',
    color: '#581e85',
    logo: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
      </svg>
    ),
  },
]

export default function BookingModal({ open, onClose }) {
  if (!open) return null

  return (
    <>
      <div className="booking-overlay" onClick={onClose} />
      <div className="booking-modal" role="dialog" aria-modal="true" aria-label="Book your stay">
        <button className="booking-close" onClick={onClose} aria-label="Close">✕</button>
        <h2 className="booking-title">Book Your Stay</h2>
        <p className="booking-subtitle">La Picholine - Vacation Rental</p>
        <div className="booking-grid">
          {PLATFORMS.map(({ name, href, color, logo }) => (
            <a
              key={name}
              href={href}
              className="booking-card"
              style={{ '--platform-color': color }}
              target="_blank"
              rel="noreferrer"
            >
              <span className="booking-card-logo">{logo}</span>
              <span className="booking-card-name">{name}</span>
            </a>
          ))}
        </div>

        <div className="booking-contact">
          <p className="booking-contact-label">Or contact us directly</p>
          <a href="mailto:kawarthawaterfrontcottage@gmail.com" className="booking-contact-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l9 7 9-7" />
            </svg>
            kawarthawaterfrontcottage@gmail.com
          </a>
          <a href="tel:+16472868630" className="booking-contact-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.5h3.28a1 1 0 0 1 .98.8l.8 3.87a1 1 0 0 1-.5 1.08l-1.9.98a12.2 12.2 0 0 0 5.9 5.9l.98-1.9a1 1 0 0 1 1.08-.5l3.87.8a1 1 0 0 1 .8.98v3.28a1 1 0 0 1-1 1C10.5 20.5 3.5 13.5 2.75 4.5a1 1 0 0 1 1-1z" />
            </svg>
            647-286-8630
          </a>
        </div>
      </div>
    </>
  )
}
