import { Link } from 'react-router-dom'
import Carousel from '../components/Carousel'
import VideoPlayer from '../components/VideoPlayer'
import './Home.css'

const SHOW_REVIEW_RATINGS = false

export default function Home() {
  return (
    <div className="layout-wrap">
      <section id="center">
        <div className="hero">
          {/* <img src={heroImg} className="base" width="170" height="179" alt="" /> */}
          {/* <img src={reactLogo} className="framework" alt="React logo" /> */}
          {/* <img src={viteLogo} className="vite" alt="Vite logo" /> */}
        </div>
        <div>
          <h1>La Picholine - Vacation Rental</h1>
          <p>Located on the northern shores of Pigeon Lake, Trent Lakes, ON.</p>
        </div>
      </section>

      {/* <div className="ticks"></div> */}

      <section id="property-video">
        {/* <h2>Property Video</h2> */}
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

      <section id="next-steps">
        {/* <div id="docs">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#documentation-icon"></use>
          </svg>
          <h2>Documentation</h2>
          <p>Your questions, answered</p>
          <ul>
            <li>
              <a href="https://vite.dev/" target="_blank" rel="noreferrer">
                <img className="logo" src={viteLogo} alt="" />
                Explore Vite
              </a>
            </li>
            <li>
              <a href="https://react.dev/" target="_blank" rel="noreferrer">
                <img className="button-icon" src={reactLogo} alt="" />
                Learn more
              </a>
            </li>
          </ul>
        </div> */}
        <div id="booking">
          {/* <svg className="icon" role="presentation" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg> */}
          <h2>Book Your Stay</h2>
          <p>Book directly or reach out to us</p>
          <ul>
            <li>
              <a href="https://www.cottagesincanada.com/42737" target="_blank" rel="noreferrer">
                Book Now
              </a>
            </li>
            <li>
              <a href="mailto:kawarthawaterfrontcottage@gmail.com">
                kawarthawaterfrontcottage@gmail.com
              </a>
            </li>
            <li>
              <a href="tel:+16472868630">
                +1 (647) 286-8630
              </a>
            </li>
          </ul>
        </div>
      </section>

      <section id="contact">
        <h2>Social Media</h2>
        <p>Follow us for updates, photos, and availability.</p>
        <div className="contact-links">
          <a
            href="https://www.instagram.com/kawarthawaterfrontcottage/"
            target="_blank"
            rel="noreferrer"
            className="contact-link"
          >
            <svg className="contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
            </svg>
            @kawarthawaterfrontcottage
          </a>
          <a
            href="https://www.youtube.com/@KawarthaWaterfrontCottage"
            target="_blank"
            rel="noreferrer"
            className="contact-link"
          >
            <svg className="contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21.58 7.19a2.51 2.51 0 0 0-1.77-1.78C18.25 5 12 5 12 5s-6.25 0-7.81.41a2.51 2.51 0 0 0-1.77 1.78A26.4 26.4 0 0 0 2 12a26.4 26.4 0 0 0 .42 4.81 2.51 2.51 0 0 0 1.77 1.78C5.75 19 12 19 12 19s6.25 0 7.81-.41a2.51 2.51 0 0 0 1.77-1.78A26.4 26.4 0 0 0 22 12a26.4 26.4 0 0 0-.42-4.81z" />
              <polygon points="10 15 15 12 10 9 10 15" fill="currentColor" stroke="none" />
            </svg>
            Kawartha Waterfront Cottage
          </a>
        </div>
      </section>

      {/* <div className="ticks"></div> */}
      {/* <section id="spacer"></section> */}
    </div>
  )
}
