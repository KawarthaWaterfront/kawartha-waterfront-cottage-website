import './Footer.css'

// Full-bleed forest-green bottom bar shared by every page: brand/location on
// the left, socials centered, booking/contact info right-aligned. Copied
// from the mockup's footer, which is identical across all of its pages.
export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <div className="site-footer-name">La Picholine</div>
          <div className="site-footer-location">Pigeon Lake, Ontario</div>
        </div>

        <div className="site-footer-socials">
          <a
            href="https://www.youtube.com/@KawarthaWaterfrontCottage"
            target="_blank"
            rel="noreferrer"
            aria-label="YouTube"
          >
            <svg className="site-footer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
            <svg className="site-footer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
            </svg>
          </a>
        </div>

        <div className="site-footer-contact">
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
  )
}
